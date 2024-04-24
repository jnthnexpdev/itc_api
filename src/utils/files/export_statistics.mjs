import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import fs from "node:fs";
import path from "node:path";

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

const convertBufferToBase64URL = (buffer, imageType = 'png') => {
    try {
      const base64String = Buffer.from(buffer).toString('base64');
      return `data:image/${imageType};base64,${base64String}`;
    } catch (error) {
      throw new Error('Error processing buffer');
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
            throw error; // Re-throw to handle it further up if necessary
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
                        {
                            image: convertImageToBase64URL('../api_server/src/assets/tnm_logo.png'),
                            fit: [100, 100]
                        },
                        {
                            image: convertImageToBase64URL('../api_server/src/assets/itc.png'),
                            fit: [60, 100],
                            alignment : 'right'
                        },
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
                        {
                            image: convertImageToBase64URL('../api_server/src/assets/tnm_logo.png'),
                            fit: [100, 100]
                        },
                        {
                            image: convertImageToBase64URL('../api_server/src/assets/itc.png'),
                            fit: [60, 100],
                            alignment : 'right'
                        },
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
