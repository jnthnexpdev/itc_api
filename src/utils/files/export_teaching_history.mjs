import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'url';
import { getDateAndTime } from '../date/date_utils.mjs';

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

function getHeaderAndLogos({docente = "Not specified", fecha = "Not specified"} = {}){

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
            stack : [
                {
                    text: [
                        'Informacion de todos los grupos impartidos por el/la docente ', {text: `${docente}`, decoration: 'underline'},
                        ' registrados en el sistema hasta ', {text: `${fecha}.`, decoration: 'underline'},
                    ]
                }
            ],
            style : 'text'
        },
        { text: '', margin: [0, 0, 0, 24] } 

    ];
}

function getNewTable() {
    return {
        table: {
            headerRows: 1,
            widths: ['10%', '30%', '15%', '15%', '15%', '15%'],
            body: [
                [
                    { text: 'Grupo', style: 'tableHeader' },
                    { text: 'Materia', style: 'tableHeader' },
                    { text: 'Periodo', style: 'tableHeader' },
                    { text: 'Aprob.', style: 'tableHeader' },
                    { text: 'Reprob.', style: 'tableHeader' },
                    { text: 'Deser.', style: 'tableHeader' },
                ] 
            ]
        },
        layout: {
            paddingLeft: function(i, node) { return 5; },
            paddingRight: function(i, node) { return 5; },
            paddingTop: function(i, node) { return 2; },
            paddingBottom: function(i, node) { return 2; },
            fillColor: function (rowIndex) { return rowIndex === 0 ? '#18316B' : null; }
        }
    };
}

const pdfStyles = {
        mainHeader: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 24, 0, 0], font: 'Montserrat' },
        header: { fontSize: 16, bold: true, alignment: 'justify', margin: [0, 24, 0, 0], font: 'Montserrat' },
        tableHeader: { fontSize: 12, bold: true, color: '#FBFFFE', fillColor: '#18316B', alignment: 'center' },
        tableData: { fontSize: 10, alignment: 'center', font: 'Montserrat' }, 
        text: { fontSize: 15, alignment: 'justify', margin: [0, 24, 0, 0], font: 'Montserrat' }
}

export async function exportTeachingHistory (groups, subjects, teacher){
    return new Promise(async (resolve, reject) => {
        const { fecha } = await getDateAndTime();
        const teacherName = teacher.nombre || "Not specified";
        const date = fecha || "Not specified";

        let content = [
            ...getHeaderAndLogos({docente : teacherName, fecha: date}),
            getNewTable()
        ];
    
        groups.forEach((item, index) => {
            if (index % 15 === 0 && index !== 0) {
                content.push({ text: '', pageBreak: 'before' });
                content.push(...getHeaderAndLogos({docente : teacherName, fecha: date}),);  
                content.push(getNewTable());
            }
            // Append row data with style
            content[content.length - 1].table.body.push([
                { text: subjects[index].claveMateria, style: 'tableData' },
                { text: subjects[index].nombreMateria, style: 'tableData' },
                { text: item.periodo, style: 'tableData' },
                { text: `${item.porcentajeAprobados}% (${item.alumnosAprobados})`, style: 'tableData' },
                { text: `${item.porcentajeReprobados}% (${item.alumnosReprobados})`, style: 'tableData' },
                { text: `${item.porcentajeDesertados}% (${item.alumnosDesertados})`, style: 'tableData' }
            ]);
        });
    
        const docDefinition = {
            content: content,
            footer: function(currentPage, pageCount) {
                return {
                    columns: [
                        { text: `${currentPage.toString()}`, alignment: 'right', margin: [0, 0, 40, 0] }
                    ]
                };
            },
            styles: pdfStyles,
            defaultStyle: { font: 'Montserrat' }
        };
    
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer) => {
            resolve(buffer);
        });
    });
}