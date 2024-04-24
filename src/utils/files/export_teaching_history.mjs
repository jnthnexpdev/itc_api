import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import fs from "node:fs";
import path from "node:path";
import { getDateAndTime } from '../date/date_utils.mjs';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const convertImageToBase64URL = (filename, imageType = 'png') => {
    try {
      const buffer = fs.readFileSync(filename);
      const base64String = Buffer.from(buffer).toString('base64');
      return `data:image/${imageType};base64,${base64String}`;
    } catch (error) {
      throw new Error(`file ${filename} no exist`);
    }
}

function setupFonts() {
    const fontFiles = [
        'Montserrat-Black.ttf', 'Montserrat-BlackItalic.ttf',
        'Montserrat-Bold.ttf', 'Montserrat-BoldItalic.ttf',
        'Montserrat-ExtraBold.ttf', 'Montserrat-ExtraBoldItalic.ttf',
        'Montserrat-ExtraLight.ttf', 'Montserrat-ExtraLightItalic.ttf',
        'Montserrat-Italic.ttf', 'Montserrat-Light.ttf',
        'Montserrat-LightItalic.ttf', 'Montserrat-Medium.ttf',
        'Montserrat-MediumItalic.ttf', 'Montserrat-Regular.ttf',
        'Montserrat-SemiBold.ttf', 'Montserrat-SemiBoldItalic.ttf',
        'Montserrat-Thin.ttf', 'Montserrat-ThinItalic.ttf'
    ];
    fontFiles.forEach(font => {
        try {
            const fontPath = path.resolve('../api_server/src/assets/fonts', font);
            pdfMake.vfs[font] = fs.readFileSync(fontPath).toString('base64');
        } catch (error) {
            console.error(`Error loading font file ${font}:`, error);
            throw error;
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
                {
                    image: convertImageToBase64URL('../api_server/src/assets/tnm_logo.png'),
                    fit: [100, 100]
                },
                {
                    image: convertImageToBase64URL('../api_server/src/assets/itc.png'),
                    fit: [60, 100],
                    alignment: 'right'
                },
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