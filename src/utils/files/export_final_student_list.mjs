import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsDir = path.join(__dirname, '..', '..', 'assets', 'fonts');

const convertImageToBase64URL = (relativePath) => {
    const basePath = path.join(__dirname, '..', '..');
    const imagePath = path.join(basePath, relativePath);

    try {
        const buffer = fs.readFileSync(imagePath);
        const base64String = Buffer.from(buffer).toString('base64');
        const imageExtension = path.extname(imagePath).slice(1); // Obtiene la extensión sin el punto
        return `data:image/${imageExtension};base64,${base64String}`;
    } catch (error) {
        console.error(`Error al convertir la imagen a Base64: ${error}`);
        return ''; // O maneja el error como prefieras
    }
};

function setupFonts() {
    const fontFiles = [
        'Montserrat-Regular.ttf', 'Montserrat-Bold.ttf', 'Montserrat-Italic.ttf', 'Montserrat-BoldItalic.ttf'
    ];
    fontFiles.forEach(font => {
        try {
            const fontPath = path.join(fontsDir, font);
            const fontData = fs.readFileSync(fontPath);
            pdfMake.vfs[font] = Buffer.from(fontData).toString('base64');
        } catch (error) {
            console.error(`Failed to load font ${font} from path ${fontPath}: ${error.message}`);
        }
    });
}

setupFonts();

pdfMake.fonts = {
    Montserrat: {
        normal: 'Montserrat-Regular.ttf',
        bold: 'Montserrat-Bold.ttf',
        italics: 'Montserrat-Italic.ttf',
        bolditalics: 'Montserrat-BoldItalic.ttf'
    }
};

function getHeaderAndLogos(subject, teacher, group) {
    return [
        {
            columns: [
                { image: convertImageToBase64URL('./assets/tnm_logo.png'), fit: [100, 100] },
                { image: convertImageToBase64URL('./assets/itc.png'), fit: [60, 100], alignment: 'right' }
            ]
        },
        { text: 'INSTITUTO TECNOLOGICO DE CUAUTLA', style: 'mainHeader' },
        { text: 'SISTEMA WEB DE MONITOREO EDUCATIVO ENFOCADO A INDICES DE REPROBACION Y DESERCION ESCOLAR', style: 'header' },
        {
            stack: [
                {
                    text: [
                        'Lista de calificaciones finales de los alumnos de la materia ',
                        {text: `${subject[0].nombreMateria} `, decoration: 'underline'},
                        ' del grupo ', {text: `${group.numeroGrupo}`, decoration: 'underline'},
                        ' impartida por el/la docente ', {text: `${teacher.nombre}`, decoration: 'underline'},
                        ' durante el periodo ', {text: `${group.periodo}.`, decoration: 'underline'},
                    ]
                }
            ],
            style: 'text'
        }
    ];
}

export async function exportFinalAverageList(group, subject, teacher, students) {
    return new Promise((resolve, reject) => {
        const headers = ['No.', 'Nombre', ...students[0].promediosUnidad.map((_, idx) => `U ${idx + 1}`), 'Promedio'];

        const docDefinition = {
            content: [],
            footer: function(currentPage, pageCount) {
                return {
                    columns: [
                        {
                            text: currentPage.toString(),
                            alignment: 'right',
                            margin: [0, 0, 40, 30]
                        }
                    ]
                };
            },
            styles: {
                mainHeader: {fontSize: 16, bold: true, alignment: 'center', margin: [0, 20, 0, 10], font: 'Montserrat'},
                header: {fontSize: 16, bold: true, alignment: 'justify', margin: [0, 0, 0, 10], font: 'Montserrat'},
                tableHeader: {fontSize: 12, bold: false, color: '#FFFFFF', fillColor: '#18316B', alignment: 'center'},
                tableDataName: { fontSize: 10, alignment: 'left', font: 'Montserrat' },
                tableData: {fontSize: 10, alignment: 'center', font: 'Montserrat'},
                text: {fontSize: 12, alignment: 'justify', margin: [0, 5, 0, 10], font: 'Montserrat'}
            },
            defaultStyle: {
                font: 'Montserrat'
            }
        };

        docDefinition.content.push(...getHeaderAndLogos(subject, teacher, group));

        students.forEach((student, index) => {
            if (index % 30 === 0 && index !== 0) {
                docDefinition.content.push({text: '', pageBreak: 'before'});
                docDefinition.content.push(...getHeaderAndLogos(subject, teacher, group));
            }
            const studentData = [
                {text: index + 1, style: 'tableData'},
                {text: student.nombre, style: 'tableDataName'},
                ...student.promediosUnidad.map(unitScore => ({text: unitScore.toString(), style: 'tableData'})),
                {text: student.promedioFinal.toString(), style: 'tableData'}
            ];

            if(index % 30 === 0) {
                docDefinition.content.push({
                    table: {
                        headerRows: 1,
                        widths: ['5%', '*', ...student.promediosUnidad.map(() => 'auto'), '15%'],
                        body: [headers.map(header => ({text: header, style: 'tableHeader'})), studentData]
                    }
                });
            } else {
                docDefinition.content[docDefinition.content.length - 1].table.body.push(studentData);
            }
        });

        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer(buffer => {
            resolve(buffer);
        });
    });
}
