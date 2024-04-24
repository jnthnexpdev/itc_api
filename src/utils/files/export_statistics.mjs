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

export async function exportStatisticsPDF(group, subject, teacher, files) {
    return new Promise((resolve, reject) => {

        const titles = [
            {
                stack : [
                    {
                        text: [
                            {text: `Grafica 1.`, bold: true},
                            ' Estado de alumnos por unidades '
                        ]
                    }
                ], 
                style : 'statisticsTitle'
            }, 
            {
                stack : [
                    {
                        text: [
                            {text: `Grafica 2.`, bold: true},
                            ' Rango de promedios'
                        ]
                    }
                ], 
                style : 'statisticsTitle'
            }, 
            {
                stack : [
                    {
                        text: [
                            {text: `Grafica 3.`, bold: true},
                            ' Estado final de los alumnos '
                        ]
                    }
                ], 
                style : 'statisticsTitle'
            }
        ];
        const descriptions = [
            "Representacion gráfica de estudiantes aprobados, reprobados y desertores a lo largo del semestre.",
            "Visualización de los promedios finales de los estudiantes dividos por rango de calificacion.",
            "Representacion gráfica de estudiantes aprobados, reprobados y desertores al finalizar el semestre."
        ];

        const images = files.map((file, index) => {
            return [
                { text: titles[index].stack, style: 'statisticsTitle' },
                { text: descriptions[index], style: 'statisticsText' },
                {
                    image: `data:image/png;base64,${Buffer.from(file.buffer).toString('base64')}`,
                    width : 520,
                    height : 200,
                    alignment: 'center'
                }
            ];
        }).flat();

        const docDefinition = {
            content: [
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
                                'Estadisticas de los alumnos del grupo ', {text: `${group.numeroGrupo}`, decoration: 'underline'},
                                ' de la materia ', {text: `${subject[0].nombreMateria}`, decoration: 'underline'},
                                ' impartida por el/la docente ', {text: `${teacher.nombre}`, decoration: 'underline'},
                                ' en el periodo ', {text: `${group.periodo}`, decoration: 'underline'},
                                ' al finalizar el curso.'
                            ]
                        }
                    ], 
                    style : 'text'
                },
                {
                    stack : [
                        {
                            text: [
                                {text: `Tabla 1.`, bold: true},
                                ' Distribución de Resultados Académicos por Unidad'
                            ]
                        }
                    ], 
                    style : 'statisticsTitle'
                },
                { text: `La siguiente tabla detalla el número de estudiantes que aprobaron, reprobaron o abandonaron el curso en cada unidad y al final del curso `, style: 'statisticsText' },
                {
                    style: 'tableBody',
                    table: {
                        widths: ['25%', '25%', '25%', '25%'], 
                        body: [
                            [
                                { text: 'Unidad', style: 'tableHeader' },
                                { text: 'Aprobados', style: 'tableHeader' },
                                { text: 'Reprobados', style: 'tableHeader' },
                                { text: 'Desertores', style: 'tableHeader' }
                            ],
                            ...group.unidades.map(unidad => [`Unidad ${unidad.unidad}`, `${unidad.alumnosAprobados}`, `${unidad.alumnosReprobados}`, `${unidad.alumnosDesertados}`]),
                            [`Final`, `${group.alumnosAprobados}`, `${group.alumnosReprobados}`, `${group.alumnosDesertados}`]
                        ]
                    },
                    layout: {
                        fillColor: function (rowIndex, node, columnIndex) {
                            return (rowIndex === 0) ? '#18316B' : null;
                        },
                        defaultBorder : true
                    }
                },
                { text: '', pageBreak: 'after' },
                {
                    columns: [
                        { image: convertImageToBase64URL('./assets/tnm_logo.png'), fit: [100, 100] },
                        { image: convertImageToBase64URL('./assets/itc.png'), fit: [60, 100], alignment: 'right' }
                    ]
                },
                { text: 'INSTITUTO TECNOLOGICO DE CUAUTLA', style: 'mainHeader' },
                { text: 'SISTEMA WEB DE MONITOREO EDUCATIVO ENFOCADO A INDICES DE REPROBACION Y DESERCION ESCOLAR', style: 'header' },
                ...images,
            ],
            footer: function(currentPage, pageCount) {
                return {
                    columns: [
                        {
                            // This text could be dynamically created using currentPage and pageCount
                            text: currentPage.toString(),
                            alignment: 'right',  // Right align text
                            margin: [0, 0, 40, 30]  // Margin [left, top, right, bottom]
                        }
                    ]
                };
            },            
            styles: {
                mainHeader: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'center',
                    font: 'Montserrat',
                    margin: [0, 24, 0, 0],
                },
                header: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'justify',
                    font: 'Montserrat',
                    margin: [0, 24, 0, 0],
                },
                statisticsTitle : {
                    fontSize: 15,
                    alignment: 'justify',
                    margin: [0, 24, 0, 0],
                    font: 'Montserrat'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 14,
                    color: '#FBFFFE',
                    fillColor: '#18316B',
                    alignment: 'center'
                },
                statisticsText : {
                    fontSize: 15,
                    alignment: 'justify',
                    margin: [0, 12, 0, 12],
                    font: 'Montserrat'
                },
                tableBody: {
                    margin: [0, 0, 0, 0],
                    fontSize: 14,
                    font: 'Montserrat',
                    alignment : 'center',
                },
                text: {
                    fontSize: 15,
                    alignment: 'justify',
                    margin: [0, 24, 0, 0],
                    font: 'Montserrat'
                },
            },
            defaultStyle: {
                font: 'Montserrat'
            }
        };
        
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer) => {
            resolve(buffer);
        });   
    });
}
