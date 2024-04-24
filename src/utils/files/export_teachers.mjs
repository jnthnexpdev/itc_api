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

function getHeaderAndLogos({carrera = "Not specified", date = "Not specified"} = {}){

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
                        'Informacion de todos los docentes de la carrera ', {text: `${carrera}`, decoration: 'underline'},
                        ' registrados en el sistema hasta ', {text: `${date}.`, decoration: 'underline'},
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
            widths: ['5%', '35%', '35%', '15%', '10%'],
            body: [
                [
                    { text: 'No', style: 'tableHeader' },
                    { text: 'Nombre', style: 'tableHeader' },
                    { text: 'Correo', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'Hora', style: 'tableHeader' }
                ]  // Initial header row
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

export async function exportTeachers(data, carrera){
    return new Promise(async (resolve, reject) => {
        const { fecha, hora } = await getDateAndTime();
        const career = carrera || "Not specified";
        const date = fecha || "Not specified";

        let content = [
            ...getHeaderAndLogos({carrera: career, date: date}),  // Use variables here
            getNewTable()
        ];
    
        data.forEach((item, index) => {
            if (index % 15 === 0 && index !== 0) {
                content.push({ text: '', pageBreak: 'before' });
                content.push(...getHeaderAndLogos({carrera: career, date: date}));  
                content.push(getNewTable());
            }
            // Append row data with style
            content[content.length - 1].table.body.push([
                { text: `${index + 1}`, style: 'tableData' },
                { text: item.nombre, style: 'tableData' },
                { text: item.correo, style: 'tableData' },
                { text: item.fechaRegistro, style: 'tableData' },
                { text: item.horaRegistro, style: 'tableData' }
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