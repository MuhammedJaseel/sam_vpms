var express = require('express');
var nodeExcel = require('excel-export');
var app = express();
var path = require('path');
var nodemailer = require('nodemailer');
var fs = require("fs");
var dateFormat = require('dateformat');
var xl = require('excel4node');
var _ = require('lodash');
var moment = require('moment-timezone');
var timezone = "Asia/Kolkata";
var momentDateformat = 'DD/MM/YYYY HH:mm';

module.exports = {
    exportXLS: function(masterDatas, venueIDs, fromDate, toDate, done) {
        if (masterDatas.length > 0) {
            var newDate = new Date().getTime();
            var maxLenofScratchImages = 0;
            var maxLenofProofs = 0;
            getMaxRecordLengthofScratchImages(0);

            function getMaxRecordLengthofScratchImages(i) {
                if (i < masterDatas.length) {
                    if (masterDatas[i].scratchesSnap) {
                        if (masterDatas[i].scratchesSnap.length > maxLenofScratchImages) {
                            maxLenofScratchImages = masterDatas[i].scratchesSnap.length;
                        }
                    }
                    i++;
                    getMaxRecordLengthofScratchImages(i);

                } else {
                    getMaxRecordLengthofProofsImages(0);

                    function getMaxRecordLengthofProofsImages(pp) {
                        if (pp < masterDatas.length) {

                            if (masterDatas[pp].proofs) {
                                if (masterDatas[pp].proofs.length > maxLenofProofs) {
                                    maxLenofProofs = masterDatas[pp].proofs.length;
                                }
                            }
                            pp++;
                            getMaxRecordLengthofProofsImages(pp);
                        } else {
                            generateWorkbook();

                            function generateWorkbook() {
                                var wb = new xl.Workbook();

                                var excellData = wb.addWorksheet('Report', {
                                    pageSetup: {
                                        fitToWidth: 1
                                    },
                                    headerFooter: {
                                        oddHeader: '',
                                        oddFooter: ''
                                    }
                                });
                                var largeText = wb.createStyle({
                                    font: {
                                        name: 'Cambria',
                                        size: 20
                                    }
                                });
                                excellData.column(2).setWidth(25);
                                excellData.row(2).setHeight(25);
                                excellData.column(3).setWidth(25);
                                excellData.column(5).setWidth(25);
                                excellData.cell(6, 1).string('Sl. No.').style({ font: { bold: true } });
                                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                                    excellData.cell(6, 2).string('Venue Name').style({ font: { bold: true } });
                                    excellData.cell(6, 3).string('Arrival Date').style({ font: { bold: true } });
                                    excellData.cell(6, 4).string('Ticket Number').style({ font: { bold: true } });
                                    excellData.cell(6, 5).string('Plate Number').style({ font: { bold: true } });
                                    excellData.cell(6, 6).string('Plate Snap').style({ font: { bold: true } });
                                    excellData.cell(6, 7).string('Brand').style({ font: { bold: true } });
                                    excellData.cell(6, 8).string('Model Name').style({ font: { bold: true } });
                                    excellData.cell(6, 9).string('Color').style({ font: { bold: true } });
                                    excellData.cell(6, 10).string('Remarks').style({ font: { bold: true } });
                                    excellData.cell(6, 11).string('Parked At').style({ font: { bold: true } });
                                    excellData.cell(6, 12).string('Parked By').style({ font: { bold: true } });
                                    excellData.cell(6, 13).string('Requested At').style({ font: { bold: true } });
                                    excellData.cell(6, 14).string('Requested By').style({ font: { bold: true } });

                                    excellData.cell(6, 15).string('Requested Later').style({ font: { bold: true } });
                                    excellData.cell(6, 16).string('More Details').style({ font: { bold: true } });

                                    excellData.cell(6, 17).string('Accepted At').style({ font: { bold: true } });
                                    excellData.cell(6, 18).string('Accepted By').style({ font: { bold: true } });
                                    excellData.cell(6, 19).string('Completed At').style({ font: { bold: true } });
                                    excellData.cell(6, 20).string('Completed By').style({ font: { bold: true } });
                                    excellData.cell(6, 21).string('Evaletz Card Missed').style({ font: { bold: true } });
                                    excellData.cell(6, 22).string('Name').style({ font: { bold: true } });
                                    excellData.cell(6, 23).string('Mobile Number').style({ font: { bold: true } });
                                    excellData.cell(6, 24).string('Change Logs').style({ font: { bold: true } });

                                    excellData.cell(6, 25).string('Cashier Name').style({ font: { bold: true } });
                                    excellData.cell(6, 26).string('Fees').style({ font: { bold: true } });
                                    excellData.cell(6, 27).string('Duration').style({ font: { bold: true } });

                                } else {
                                    excellData.cell(6, 2).string('Arrival Date').style({ font: { bold: true } });
                                    excellData.cell(6, 3).string('Token Number').style({ font: { bold: true } });
                                    excellData.cell(6, 4).string('Plate Number').style({ font: { bold: true } });
                                    excellData.cell(6, 5).string('Plate Snap').style({ font: { bold: true } });
                                    excellData.cell(6, 6).string('Brand').style({ font: { bold: true } });
                                    excellData.cell(6, 7).string('Model Name').style({ font: { bold: true } });
                                    excellData.cell(6, 8).string('Color').style({ font: { bold: true } });
                                    excellData.cell(6, 9).string('Remarks').style({ font: { bold: true } });
                                    excellData.cell(6, 10).string('Parked At').style({ font: { bold: true } });
                                    excellData.cell(6, 11).string('Parked By').style({ font: { bold: true } });
                                    excellData.cell(6, 12).string('Requested At').style({ font: { bold: true } });
                                    excellData.cell(6, 13).string('Requested By').style({ font: { bold: true } });

                                    excellData.cell(6, 14).string('Requested Later').style({ font: { bold: true } });
                                    excellData.cell(6, 15).string('More Details').style({ font: { bold: true } });

                                    excellData.cell(6, 16).string('Accepted At').style({ font: { bold: true } });
                                    excellData.cell(6, 17).string('Accepted By').style({ font: { bold: true } });
                                    excellData.cell(6, 18).string('Completed At').style({ font: { bold: true } });
                                    excellData.cell(6, 19).string('Completed By').style({ font: { bold: true } });
                                    excellData.cell(6, 20).string('Evaletz Card Missed').style({ font: { bold: true } });
                                    excellData.cell(6, 21).string('Name').style({ font: { bold: true } });
                                    excellData.cell(6, 22).string('Mobile Number').style({ font: { bold: true } });
                                    excellData.cell(6, 23).string('Change Logs').style({ font: { bold: true } });


                                    excellData.cell(6, 24).string('Cashier Name').style({ font: { bold: true } });
                                    excellData.cell(6, 25).string('Fees').style({ font: { bold: true } });
                                    excellData.cell(6, 26).string('Duration').style({ font: { bold: true } });
                                }

                                writeScratchData(0);

                                function writeScratchData(w) {
                                    if (w < maxLenofScratchImages) {
                                        if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                            excellData.cell(6, 28 + w).string('Camera Capture ' + (w + 1)).style({ font: { bold: true } });
                                        else
                                            excellData.cell(6, 27 + w).string('Camera Capture ' + (w + 1)).style({ font: { bold: true } });
                                        w++;
                                        writeScratchData(w);
                                    } else {
                                        writeProofsData(0);

                                        function writeProofsData(p) {
                                            if (p < maxLenofProofs) {
                                                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                                    excellData.cell(6, (28 + p + maxLenofScratchImages)).string('Proof ' + (p + 1)).style({ font: { bold: true } });
                                                else
                                                    excellData.cell(6, (27 + p + maxLenofScratchImages)).string('Proof ' + (p + 1)).style({ font: { bold: true } });
                                                p++;
                                                writeProofsData(p);
                                            } else {

                                                toWriteRowinExcell(0);

                                                function toWriteRowinExcell(x) {
                                                    if (x < masterDatas.length) {
                                                        excellData.cell(2, 2).string(masterDatas[x].AccountName.toUpperCase()).style(largeText);

                                                        excellData.cell(4, 2, 4, 3, true).string('Report From : ' + moment(fromDate).format("DD-MM-YYYY")  + "  To :  " + moment(toDate).format("DD-MM-YYYY") ).style({ font: { bold: true } });
                                                        excellData.cell((x + 7), 1).string("" + masterDatas[x].Sino)
                                                        if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                                            excellData.cell(4, 4, 4, 5, true).string('Venue : All').style({ font: { bold: true } });
                                                        else
                                                            excellData.cell(4, 4, 4, 5, true).string('Venue : ' + masterDatas[x].Venuename).style({ font: { bold: true } });
                                                        if (venueIDs == 'All' || venueIDs == '' || venueIDs == null) {
                                                            excellData.cell((x + 7), 2).string("" + masterDatas[x].Venuename)
                                                            excellData.cell((x + 7), 3).string("" + (masterDatas[x].Date));
                                                            excellData.cell((x + 7), 4).string("" + masterDatas[x].TokenNumber)
                                                            excellData.cell((x + 7), 5).string("" + masterDatas[x].plateNumber.toUpperCase())
                                                            if (masterDatas[x].plateSnap != 'noImage') {
                                                                /*excellData.addImage({
                                                                    path: "assets/images/" + masterDatas[x].plateSnap,
                                                                    type: 'picture',
                                                                    position: {
                                                                        type: 'twoCellAnchor',

                                                                        from: {
                                                                            col: 7,
                                                                            // colOff: '-2mm',
                                                                            row: (x + 2),
                                                                            // rowOff: 0
                                                                        },
                                                                        to: {
                                                                            col: 8,
                                                                            // colOff: 0,
                                                                            row: (x + 3),
                                                                            // rowOff: 0
                                                                        }
                                                                    }
                                                                });*/
                                                                var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                                                excellData.cell((x + 7), 6).link(_temp)
                                                            }

                                                            if (masterDatas[x].brand != undefined)
                                                                excellData.cell((x + 7), 7).string(masterDatas[x].brand)
                                                            if (masterDatas[x].modelName != undefined)
                                                                excellData.cell((x + 7), 8).string(masterDatas[x].modelName)
                                                            if (masterDatas[x].color != undefined)
                                                                excellData.cell((x + 7), 9).string(masterDatas[x].color)
                                                            if (masterDatas[x].remarks != undefined)
                                                                excellData.cell((x + 7), 10).string(masterDatas[x].remarks)
                                                            if (masterDatas[x].ParkedAt != undefined)
                                                                excellData.cell((x + 7), 11).string("" + (masterDatas[x].ParkedAt))
                                                            if (masterDatas[x].ParkedBy != undefined)
                                                                excellData.cell((x + 7), 12).string("" + masterDatas[x].ParkedBy)
                                                            if (masterDatas[x].RequestedAt != undefined)
                                                                excellData.cell((x + 7), 13).string("" + (masterDatas[x].RequestedAt))
                                                            if (masterDatas[x].RequestedBy != undefined)
                                                                excellData.cell((x + 7), 14).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));


                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 15).string("Yes")
                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 16).string("" + masterDatas[x].MoreDetails)



                                                            if (masterDatas[x].AcceptedAt != undefined)
                                                                excellData.cell((x + 7), 17).string("" + masterDatas[x].AcceptedAt)
                                                            if (masterDatas[x].AcceptedBy != undefined)
                                                                excellData.cell((x + 7), 18).string("" + masterDatas[x].AcceptedBy)
                                                            if (masterDatas[x].completedAt != undefined)
                                                                excellData.cell((x + 7), 19).string("" + masterDatas[x].completedAt)
                                                            if (masterDatas[x].completedBy != undefined)
                                                                excellData.cell((x + 7), 20).string("" + masterDatas[x].completedBy)
                                                            if (masterDatas[x].cardMissed == 'yes') {
                                                                excellData.cell((x + 7), 21).string("" + masterDatas[x].cardMissed)
                                                                excellData.cell((x + 7), 22).string("" + masterDatas[x].name)
                                                                excellData.cell((x + 7), 23).string("" + masterDatas[x].mobileNumber)
                                                            }
                                                            if (masterDatas[x].changeLogs != undefined)
                                                                excellData.cell((x + 7), 24).string("" + masterDatas[x].changeLogs)



                                                            if (masterDatas[x].cashierName != undefined)
                                                                excellData.cell((x + 7), 25).string("" + masterDatas[x].cashierName)
                                                            if (masterDatas[x].fees != undefined)
                                                                excellData.cell((x + 7), 26).string("" + masterDatas[x].fees)
                                                            if (masterDatas[x].diff != undefined)
                                                                excellData.cell((x + 7), 27).string("" + masterDatas[x].diff)
                                                            
                                                        } else {
                                                            excellData.cell((x + 7), 2).string("" + masterDatas[x].Date)
                                                            excellData.cell((x + 7), 3).string("" + masterDatas[x].TokenNumber)
                                                            excellData.cell((x + 7), 4).string("" + masterDatas[x].plateNumber.toUpperCase())
                                                            if (masterDatas[x].plateSnap != 'noImage') {
                                                                /*excellData.addImage({
                                                                    path: "assets/images/" + masterDatas[x].plateSnap,
                                                                    type: 'picture',
                                                                    position: {
                                                                        type: 'twoCellAnchor',

                                                                        from: {
                                                                            col: 7,
                                                                            // colOff: '-2mm',
                                                                            row: (x + 2),
                                                                            // rowOff: 0
                                                                        },
                                                                        to: {
                                                                            col: 8,
                                                                            // colOff: 0,
                                                                            row: (x + 3),
                                                                            // rowOff: 0
                                                                        }
                                                                    }
                                                                });*/
                                                                var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                                                excellData.cell((x + 7), 5).link(_temp)
                                                            }
                                                            if (masterDatas[x].brand != undefined)
                                                                excellData.cell((x + 7), 6).string(masterDatas[x].brand)
                                                            if (masterDatas[x].modelName != undefined)
                                                                excellData.cell((x + 7), 7).string(masterDatas[x].modelName)
                                                            if (masterDatas[x].color != undefined)
                                                                excellData.cell((x + 7), 8).string(masterDatas[x].color)
                                                            if (masterDatas[x].remarks != undefined)
                                                                excellData.cell((x + 7), 9).string(masterDatas[x].remarks)
                                                            if (masterDatas[x].ParkedAt != undefined)
                                                                excellData.cell((x + 7), 10).string("" + masterDatas[x].ParkedAt)
                                                            if (masterDatas[x].ParkedBy != undefined)
                                                                excellData.cell((x + 7), 11).string("" + masterDatas[x].ParkedBy)
                                                            if (masterDatas[x].RequestedAt != undefined)
                                                                excellData.cell((x + 7), 12).string("" + masterDatas[x].RequestedAt)
                                                            if (masterDatas[x].RequestedBy != undefined)
                                                                excellData.cell((x + 7), 13).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));

                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 14).string("Yes")
                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 15).string("" + masterDatas[x].MoreDetails)




                                                            if (masterDatas[x].AcceptedAt != undefined)
                                                                excellData.cell((x + 7), 16).string("" + masterDatas[x].AcceptedAt)
                                                            if (masterDatas[x].AcceptedBy != undefined)
                                                                excellData.cell((x + 7), 17).string("" + masterDatas[x].AcceptedBy)
                                                            if (masterDatas[x].completedAt != undefined)
                                                                excellData.cell((x + 7), 18).string("" + masterDatas[x].completedAt)
                                                            if (masterDatas[x].completedBy != undefined)
                                                                excellData.cell((x + 7), 19).string("" + masterDatas[x].completedBy)
                                                            if (masterDatas[x].cardMissed == 'yes') {
                                                                excellData.cell((x + 7), 20).string("" + masterDatas[x].cardMissed)
                                                                excellData.cell((x + 7), 21).string("" + masterDatas[x].name)
                                                                excellData.cell((x + 7), 22).string("" + masterDatas[x].mobileNumber)
                                                            }
                                                            if (masterDatas[x].changeLogs != undefined)
                                                                excellData.cell((x + 7), 23).string("" + masterDatas[x].changeLogs)



                                                            if (masterDatas[x].cashierName != undefined)
                                                                excellData.cell((x + 7), 24).string("" + masterDatas[x].cashierName)
                                                            if (masterDatas[x].fees != undefined)
                                                                excellData.cell((x + 7), 25).string("" + masterDatas[x].fees)
                                                            if (masterDatas[x].diff != undefined)
                                                                excellData.cell((x + 7), 26).string("" + masterDatas[x].diff)
                                                        }

                                                        writeEachColumnScratchData(0);

                                                        function writeEachColumnScratchData(www) {
                                                            if (masterDatas[x].scratchesSnap) {
                                                                if (www < masterDatas[x].scratchesSnap.length) {
                                                                    console.log("assets/images/" +
                                                                        masterDatas[x].scratchesSnap[www])
                                                                    fs.stat("assets/images/" +
                                                                        masterDatas[x].scratchesSnap[www],
                                                                        function(err, stat) {
                                                                            if (err == null) {
                                                                                if (masterDatas[x]) {
                                                                                    if (masterDatas[x].scratchesSnap != null) {
                                                                                        fs.exists("assets/images/" + masterDatas[x].scratchesSnap[www], function(exists) {
                                                                                            console.log('File exists');
                                                                                            if (exists) {
                                                                                                console.log('File exists');
                                                                                                if (masterDatas[x].scratchesSnap[www]) {
                                                                                                    var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].scratchesSnap[www];
                                                                                                    if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                                                                                        excellData.cell((x + 7), (28 + www)).link(_temp)
                                                                                                    else
                                                                                                        excellData.cell((x + 7), (27 + www)).link(_temp)
                                                                                                        /*  excellData.addImage({
                                                                                                              path: "assets/images/" + masterDatas[x].scratchesSnap[www],
                                                                                                              type: 'picture',
                                                                                                              position: {
                                                                                                                  type: 'twoCellAnchor',

                                                                                                                  from: {
                                                                                                                      col: (19 + www),
                                                                                                                     
                                                                                                                      row: (x + 2),
                                                                                                                      
                                                                                                                  },
                                                                                                                  to: {
                                                                                                                      col: (19 + www + 1),
                                                                                                                     
                                                                                                                      row: (x + 3),
                                                                                                                    
                                                                                                                  }
                                                                                                              }
                                                                                                          }); */

                                                                                                    www++;
                                                                                                    writeEachColumnScratchData(www);
                                                                                                } else {
                                                                                                    www++;
                                                                                                    writeEachColumnScratchData(www);
                                                                                                }

                                                                                            } else {
                                                                                                www++;
                                                                                                writeEachColumnScratchData(www);
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                }

                                                                            } else if (err.code == 'ENOENT') {
                                                                                // file does not exist
                                                                                fs.writeFile('log.txt', 'Some log\n');
                                                                                www++;
                                                                                writeEachColumnScratchData(www);
                                                                            } else {
                                                                                console.log('Some other error: ', err.code);
                                                                                www++;
                                                                                writeEachColumnScratchData(www);
                                                                            }
                                                                        });
                                                                } else {
                                                                    writeEachColumnProofsData(0);

                                                                    function writeEachColumnProofsData(ppp) {
                                                                        if (masterDatas[x].proofs) {
                                                                            console.log("================="+ masterDatas[x].parkingID)
                                                                            console.log(masterDatas[x].proofs)



                                                                            if (ppp < masterDatas[x].proofs.length) {
                                                                                fs.stat("assets/images/" +
                                                                                    masterDatas[x].proofs[ppp],
                                                                                    function(err, stat) {
                                                                                        if (err == null) {
                                                                                            console.log('File exists');
                                                                                            if (masterDatas[x].proofs != null) {
                                                                                                fs.exists("assets/images/" + masterDatas[x].proofs[ppp], function(exists) {
                                                                                                    console.log('File exists 1111111111');
                                                                                                    if (exists) {
                                                                                                        /*excellData.addImage({
                                                                                                            path: "assets/images/" +
                                                                                                                masterDatas[x].proofs[ppp],
                                                                                                            type: 'picture',
                                                                                                            position: {
                                                                                                                type: 'twoCellAnchor',

                                                                                                                from: {
                                                                                                                    col: (19 + ppp + maxLenofScratchImages),
                                                                                                                    // colOff: '-2mm',
                                                                                                                    row: (x + 2),
                                                                                                                    // rowOff: 0
                                                                                                                },
                                                                                                                to: {
                                                                                                                    col: (19 + ppp + 1 + maxLenofScratchImages),
                                                                                                                    // colOff: 0,
                                                                                                                    row: (x + 3),
                                                                                                                    // rowOff: 0
                                                                                                                }
                                                                                                            }
                                                                                                        });*/
                                                                                                        var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].proofs[ppp];
                                                                                                        if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                                                                                            excellData.cell((x + 7), (28 + ppp + maxLenofScratchImages)).link(_temp)
                                                                                                        else
                                                                                                            excellData.cell((x + 7), (27 + ppp + maxLenofScratchImages)).link(_temp)
                                                                                                        ppp++;
                                                                                                        writeEachColumnProofsData(ppp);
                                                                                                    } else {
                                                                                                        ppp++;
                                                                                                        writeEachColumnProofsData(ppp);
                                                                                                    }
                                                                                                });
                                                                                            }

                                                                                        } else if (err.code == 'ENOENT') {
                                                                                            // file does not exist
                                                                                            fs.writeFile('log.txt', 'Some log\n');
                                                                                            ppp++;
                                                                                            writeEachColumnProofsData(ppp);
                                                                                        } else {
                                                                                            console.log('Some other error: ', err.code);
                                                                                            ppp++;
                                                                                            writeEachColumnProofsData(ppp);
                                                                                        }
                                                                                    });
                                                                            } else {
                                                                                x++;
                                                                                toWriteRowinExcell(x);
                                                                            }

                                                                        } else {
                                                                            x++;
                                                                            toWriteRowinExcell(x);
                                                                        }
                                                                    }
                                                                }
                                                            } else {
                                                                x++;
                                                                toWriteRowinExcell(x);
                                                            }

                                                        }
                                                    } else {
                                                        wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                                            console.log('Excel.xlsx written and has the following stats');
                                                            // res.send(newDate + ".xlsx");
                                                            done(newDate + ".xlsx");
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // res.send("no.xlsx");
            done("no.xlsx");
        }
    },
    exportXLSforAdmin: function(masterDatas, venueIDs, fromDate, toDate, done) {
        if (masterDatas.length > 0) {
            var newDate = new Date().getTime();
            var maxLenofScratchImages = 0;
            var maxLenofProofs = 0;
            getMaxRecordLengthofScratchImages(0);

            function getMaxRecordLengthofScratchImages(i) {
                if (i < masterDatas.length) {
                    if (masterDatas[i].scratchesSnap) {
                        if (masterDatas[i].scratchesSnap.length > maxLenofScratchImages) {
                            maxLenofScratchImages = masterDatas[i].scratchesSnap.length;
                        }
                    }
                    i++;
                    getMaxRecordLengthofScratchImages(i);

                } else {
                    getMaxRecordLengthofProofsImages(0);

                    function getMaxRecordLengthofProofsImages(pp) {
                        if (pp < masterDatas.length) {

                            if (masterDatas[pp].proofs) {
                                if (masterDatas[pp].proofs.length > maxLenofProofs) {
                                    maxLenofProofs = masterDatas[pp].proofs.length;
                                }
                            }
                            pp++;
                            getMaxRecordLengthofProofsImages(pp);
                        } else {
                            generateWorkbook();

                            function generateWorkbook() {
                                var wb = new xl.Workbook();

                                var excellData = wb.addWorksheet('Report', {
                                    pageSetup: {
                                        fitToWidth: 1
                                    },
                                    headerFooter: {
                                        oddHeader: '',
                                        oddFooter: ''
                                    }
                                });
                                var largeText = wb.createStyle({
                                    font: {
                                        name: 'Cambria',
                                        size: 20
                                    }
                                });
                                excellData.column(2).setWidth(25);
                                excellData.row(2).setHeight(25);
                                excellData.column(3).setWidth(25);
                                excellData.column(5).setWidth(25);
                                excellData.cell(6, 1).string('Sl. No.').style({ font: { bold: true } });
                                if (venueIDs == 'All Account') {
                                    excellData.cell(6, 2).string('Account Name').style({ font: { bold: true } });
                                    excellData.cell(6, 3).string('Venue Name').style({ font: { bold: true } });
                                    excellData.cell(6, 4).string('Arrival Date').style({ font: { bold: true } });
                                    excellData.cell(6, 5).string('Ticket Number').style({ font: { bold: true } });
                                    excellData.cell(6, 6).string('Plate Number').style({ font: { bold: true } });
                                    excellData.cell(6, 7).string('Plate Snap').style({ font: { bold: true } });
                                    excellData.cell(6, 8).string('Brand').style({ font: { bold: true } });
                                    excellData.cell(6, 9).string('Model Name').style({ font: { bold: true } });
                                    excellData.cell(6, 10).string('Color').style({ font: { bold: true } });
                                    excellData.cell(6, 11).string('Remarks').style({ font: { bold: true } });
                                    excellData.cell(6, 12).string('Parked At').style({ font: { bold: true } });
                                    excellData.cell(6, 13).string('Parked By').style({ font: { bold: true } });
                                    excellData.cell(6, 14).string('Requested At').style({ font: { bold: true } });
                                    excellData.cell(6, 15).string('Requested By').style({ font: { bold: true } });

                                    excellData.cell(6, 16).string('Requested Later').style({ font: { bold: true } });
                                    excellData.cell(6, 17).string('More Details').style({ font: { bold: true } });

                                    excellData.cell(6, 18).string('Accepted At').style({ font: { bold: true } });
                                    excellData.cell(6, 19).string('Accepted By').style({ font: { bold: true } });
                                    excellData.cell(6, 20).string('Completed At').style({ font: { bold: true } });
                                    excellData.cell(6, 21).string('Completed By').style({ font: { bold: true } });
                                    excellData.cell(6, 22).string('Evaletz Card Missed').style({ font: { bold: true } });
                                    excellData.cell(6, 23).string('Name').style({ font: { bold: true } });
                                    excellData.cell(6, 24).string('Mobile Number').style({ font: { bold: true } });
                                    excellData.cell(6, 25).string('Change Logs').style({ font: { bold: true } });
                                } else {
                                    excellData.cell(6, 2).string('Venue Name').style({ font: { bold: true } });
                                    excellData.cell(6, 3).string('Arrival Date').style({ font: { bold: true } });
                                    excellData.cell(6, 4).string('Token Number').style({ font: { bold: true } });
                                    excellData.cell(6, 5).string('Plate Number').style({ font: { bold: true } });
                                    excellData.cell(6, 6).string('Plate Snap').style({ font: { bold: true } });
                                    excellData.cell(6, 7).string('Brand').style({ font: { bold: true } });
                                    excellData.cell(6, 8).string('Model Name').style({ font: { bold: true } });
                                    excellData.cell(6, 9).string('Color').style({ font: { bold: true } });
                                    excellData.cell(6, 10).string('Remarks').style({ font: { bold: true } });
                                    excellData.cell(6, 11).string('Parked At').style({ font: { bold: true } });
                                    excellData.cell(6, 12).string('Parked By').style({ font: { bold: true } });
                                    excellData.cell(6, 13).string('Requested At').style({ font: { bold: true } });
                                    excellData.cell(6, 14).string('Requested By').style({ font: { bold: true } });

                                    excellData.cell(6, 15).string('Requested Later').style({ font: { bold: true } });
                                    excellData.cell(6, 16).string('More Details').style({ font: { bold: true } });

                                    excellData.cell(6, 17).string('Accepted At').style({ font: { bold: true } });
                                    excellData.cell(6, 18).string('Accepted By').style({ font: { bold: true } });
                                    excellData.cell(6, 19).string('Completed At').style({ font: { bold: true } });
                                    excellData.cell(6, 20).string('Completed By').style({ font: { bold: true } });
                                    excellData.cell(6, 21).string('Evaletz Card Missed').style({ font: { bold: true } });
                                    excellData.cell(6, 22).string('Name').style({ font: { bold: true } });
                                    excellData.cell(6, 23).string('Mobile Number').style({ font: { bold: true } });
                                    excellData.cell(6, 24).string('Change Logs').style({ font: { bold: true } });
                                }

                                writeScratchData(0);

                                function writeScratchData(w) {
                                    if (w < maxLenofScratchImages) {
                                        if (venueIDs == 'All Account')
                                            excellData.cell(6, 26 + w).string('Camera Capture ' + (w + 1)).style({ font: { bold: true } });
                                        else
                                            excellData.cell(6, 25 + w).string('Camera Capture ' + (w + 1)).style({ font: { bold: true } });
                                        w++;
                                        writeScratchData(w);
                                    } else {
                                        writeProofsData(0);

                                        function writeProofsData(p) {
                                            if (p < maxLenofProofs) {
                                                if (venueIDs == 'All Account')
                                                    excellData.cell(6, (26 + p + maxLenofScratchImages)).string('Proof ' + (p + 1)).style({ font: { bold: true } });
                                                else
                                                    excellData.cell(6, (25 + p + maxLenofScratchImages)).string('Proof ' + (p + 1)).style({ font: { bold: true } });
                                                p++;
                                                writeProofsData(p);
                                            } else {

                                                toWriteRowinExcell(0);

                                                function toWriteRowinExcell(x) {
                                                    if (x < masterDatas.length) {
                                                        excellData.cell(2, 2).string(masterDatas[x].AccountName.toUpperCase()).style(largeText);
                                                        excellData.cell(4, 2, 4, 3, true).string('Report From : ' + moment(fromDate).format("DD-MM-YYYY")  + "  To :  " + moment(toDate).format("DD-MM-YYYY")).style({ font: { bold: true } });
                                                        excellData.cell((x + 7), 1).string("" + masterDatas[x].Sino)
                                                        if (venueIDs == 'All Account')
                                                            excellData.cell(4, 4, 4, 5, true).string('Account : All').style({ font: { bold: true } });
                                                        else {
                                                            excellData.cell(4, 4, 4, 5, true).string('Account : ' + masterDatas[x].AccountName).style({ font: { bold: true } });
                                                        }
                                                        if (venueIDs == 'All Account') {
                                                            excellData.cell((x + 7), 2).string("" + masterDatas[x].AccountName)
                                                            excellData.cell((x + 7), 3).string("" + masterDatas[x].Venuename)
                                                            excellData.cell((x + 7), 4).string("" + (masterDatas[x].Date));
                                                            excellData.cell((x + 7), 5).string("" + masterDatas[x].TokenNumber)
                                                            excellData.cell((x + 7), 6).string("" + masterDatas[x].plateNumber.toUpperCase())
                                                            if (masterDatas[x].plateSnap != 'noImage') {
                                                                /*excellData.addImage({
                                                                    path: "assets/images/" + masterDatas[x].plateSnap,
                                                                    type: 'picture',
                                                                    position: {
                                                                        type: 'twoCellAnchor',

                                                                        from: {
                                                                            col: 7,
                                                                            // colOff: '-2mm',
                                                                            row: (x + 2),
                                                                            // rowOff: 0
                                                                        },
                                                                        to: {
                                                                            col: 8,
                                                                            // colOff: 0,
                                                                            row: (x + 3),
                                                                            // rowOff: 0
                                                                        }
                                                                    }
                                                                });*/
                                                                var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                                                excellData.cell((x + 7), 7).link(_temp)
                                                            }

                                                            if (masterDatas[x].brand != undefined)
                                                                excellData.cell((x + 7), 8).string(masterDatas[x].brand)
                                                            if (masterDatas[x].modelName != undefined)
                                                                excellData.cell((x + 7), 9).string(masterDatas[x].modelName)
                                                            if (masterDatas[x].color != undefined)
                                                                excellData.cell((x + 7), 10).string(masterDatas[x].color)
                                                            if (masterDatas[x].remarks != undefined)
                                                                excellData.cell((x + 7), 11).string(masterDatas[x].remarks)
                                                            if (masterDatas[x].ParkedAt != undefined)
                                                                excellData.cell((x + 7), 12).string("" + (masterDatas[x].ParkedAt))
                                                            if (masterDatas[x].ParkedBy != undefined)
                                                                excellData.cell((x + 7), 13).string("" + masterDatas[x].ParkedBy)
                                                            if (masterDatas[x].RequestedAt != undefined)
                                                                excellData.cell((x + 7), 14).string("" + (masterDatas[x].RequestedAt))
                                                            if (masterDatas[x].RequestedBy != undefined)
                                                                excellData.cell((x + 7), 15).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));

                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 16).string("Yes")
                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 17).string("" + masterDatas[x].MoreDetails)


                                                            if (masterDatas[x].AcceptedAt != undefined)
                                                                excellData.cell((x + 7), 18).string("" + masterDatas[x].AcceptedAt)
                                                            if (masterDatas[x].AcceptedBy != undefined)
                                                                excellData.cell((x + 7), 19).string("" + masterDatas[x].AcceptedBy)
                                                            if (masterDatas[x].completedAt != undefined)
                                                                excellData.cell((x + 7), 20).string("" + masterDatas[x].completedAt)
                                                            if (masterDatas[x].completedBy != undefined)
                                                                excellData.cell((x + 7), 21).string("" + masterDatas[x].completedBy)
                                                            if (masterDatas[x].cardMissed == 'yes') {
                                                                excellData.cell((x + 7), 22).string("" + masterDatas[x].cardMissed)
                                                                excellData.cell((x + 7), 23).string("" + masterDatas[x].name)
                                                                excellData.cell((x + 7), 24).string("" + masterDatas[x].mobileNumber)
                                                            }
                                                            if (masterDatas[x].changeLogs != undefined)
                                                                excellData.cell((x + 7), 25).string("" + masterDatas[x].changeLogs)
                                                        } else {
                                                            excellData.cell((x + 7), 2).string("" + masterDatas[x].Venuename)
                                                            excellData.cell((x + 7), 3).string("" + masterDatas[x].Date)
                                                            excellData.cell((x + 7), 4).string("" + masterDatas[x].TokenNumber)
                                                            excellData.cell((x + 7), 5).string("" + masterDatas[x].plateNumber.toUpperCase())
                                                            if (masterDatas[x].plateSnap != 'noImage') {
                                                                /*excellData.addImage({
                                                                    path: "assets/images/" + masterDatas[x].plateSnap,
                                                                    type: 'picture',
                                                                    position: {
                                                                        type: 'twoCellAnchor',

                                                                        from: {
                                                                            col: 7,
                                                                            // colOff: '-2mm',
                                                                            row: (x + 2),
                                                                            // rowOff: 0
                                                                        },
                                                                        to: {
                                                                            col: 8,
                                                                            // colOff: 0,
                                                                            row: (x + 3),
                                                                            // rowOff: 0
                                                                        }
                                                                    }
                                                                });*/
                                                                var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                                                excellData.cell((x + 7), 6).link(_temp)
                                                            }
                                                            if (masterDatas[x].brand != undefined)
                                                                excellData.cell((x + 7), 7).string(masterDatas[x].brand)
                                                            if (masterDatas[x].modelName != undefined)
                                                                excellData.cell((x + 7), 8).string(masterDatas[x].modelName)
                                                            if (masterDatas[x].color != undefined)
                                                                excellData.cell((x + 7), 9).string(masterDatas[x].color)
                                                            if (masterDatas[x].remarks != undefined)
                                                                excellData.cell((x + 7), 10).string(masterDatas[x].remarks)
                                                            if (masterDatas[x].ParkedAt != undefined)
                                                                excellData.cell((x + 7), 11).string("" + masterDatas[x].ParkedAt)
                                                            if (masterDatas[x].ParkedBy != undefined)
                                                                excellData.cell((x + 7), 12).string("" + masterDatas[x].ParkedBy)
                                                            if (masterDatas[x].RequestedAt != undefined)
                                                                excellData.cell((x + 7), 13).string("" + masterDatas[x].RequestedAt)
                                                            if (masterDatas[x].RequestedBy != undefined)
                                                                excellData.cell((x + 7), 14).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));

                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 15).string("Yes")
                                                            if (masterDatas[x].MoreDetails != undefined)
                                                                excellData.cell((x + 7), 16).string("" + masterDatas[x].MoreDetails)

                                                            

                                                            if (masterDatas[x].AcceptedAt != undefined)
                                                                excellData.cell((x + 7), 17).string("" + masterDatas[x].AcceptedAt)
                                                            if (masterDatas[x].AcceptedBy != undefined)
                                                                excellData.cell((x + 7), 18).string("" + masterDatas[x].AcceptedBy)
                                                            if (masterDatas[x].completedAt != undefined)
                                                                excellData.cell((x + 7), 19).string("" + masterDatas[x].completedAt)
                                                            if (masterDatas[x].completedBy != undefined)
                                                                excellData.cell((x + 7), 20).string("" + masterDatas[x].completedBy)
                                                            if (masterDatas[x].cardMissed == 'yes') {
                                                                excellData.cell((x + 7), 21).string("" + masterDatas[x].cardMissed)
                                                                excellData.cell((x + 7), 22).string("" + masterDatas[x].name)
                                                                excellData.cell((x + 7), 23).string("" + masterDatas[x].mobileNumber)
                                                            }
                                                            if (masterDatas[x].changeLogs != undefined)
                                                                excellData.cell((x + 7), 24).string("" + masterDatas[x].changeLogs)
                                                        }

                                                        writeEachColumnScratchData(0);

                                                        function writeEachColumnScratchData(www) {
                                                            if (masterDatas[x].scratchesSnap) {
                                                                if (www < masterDatas[x].scratchesSnap.length) {
                                                                    console.log("assets/images/" +
                                                                        masterDatas[x].scratchesSnap[www])
                                                                    fs.stat("assets/images/" +
                                                                        masterDatas[x].scratchesSnap[www],
                                                                        function(err, stat) {
                                                                            if (err == null) {
                                                                                if (masterDatas[x]) {
                                                                                    if (masterDatas[x].scratchesSnap != null) {
                                                                                        fs.exists("assets/images/" + masterDatas[x].scratchesSnap[www], function(exists) {
                                                                                            console.log('File exists');
                                                                                            if (exists) {
                                                                                                console.log('File exists');
                                                                                                if (masterDatas[x].scratchesSnap[www]) {
                                                                                                    var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].scratchesSnap[www];
                                                                                                    if (venueIDs == 'All Account')
                                                                                                        excellData.cell((x + 7), (26 + www)).link(_temp)
                                                                                                    else
                                                                                                        excellData.cell((x + 7), (25 + www)).link(_temp)
                                                                                                        /*  excellData.addImage({
                                                                                                              path: "assets/images/" + masterDatas[x].scratchesSnap[www],
                                                                                                              type: 'picture',
                                                                                                              position: {
                                                                                                                  type: 'twoCellAnchor',

                                                                                                                  from: {
                                                                                                                      col: (19 + www),
                                                                                                                     
                                                                                                                      row: (x + 2),
                                                                                                                      
                                                                                                                  },
                                                                                                                  to: {
                                                                                                                      col: (19 + www + 1),
                                                                                                                     
                                                                                                                      row: (x + 3),
                                                                                                                    
                                                                                                                  }
                                                                                                              }
                                                                                                          }); */

                                                                                                    www++;
                                                                                                    writeEachColumnScratchData(www);
                                                                                                } else {
                                                                                                    www++;
                                                                                                    writeEachColumnScratchData(www);
                                                                                                }

                                                                                            } else {
                                                                                                www++;
                                                                                                writeEachColumnScratchData(www);
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                }

                                                                            } else if (err.code == 'ENOENT') {
                                                                                // file does not exist
                                                                                fs.writeFile('log.txt', 'Some log\n');
                                                                                www++;
                                                                                writeEachColumnScratchData(www);
                                                                            } else {
                                                                                console.log('Some other error: ', err.code);
                                                                                www++;
                                                                                writeEachColumnScratchData(www);
                                                                            }
                                                                        });
                                                                } else {
                                                                    writeEachColumnProofsData(0);

                                                                    function writeEachColumnProofsData(ppp) {
                                                                        if (masterDatas[x].proofs) {

                                                                            console.log("================="+ masterDatas[x].parkingID)
                                                                            console.log(masterDatas[x].proofs)


                                                                            if (ppp < masterDatas[x].proofs.length) {
                                                                                fs.stat("assets/images/" +
                                                                                    masterDatas[x].proofs[ppp],
                                                                                    function(err, stat) {
                                                                                        if (err == null) {
                                                                                            console.log('File exists');
                                                                                            if (masterDatas[x].proofs != null) {
                                                                                                fs.exists("assets/images/" + masterDatas[x].proofs[ppp], function(exists) {
                                                                                                    console.log('File exists 1111111111');
                                                                                                    if (exists) {
                                                                                                        /*excellData.addImage({
                                                                                                            path: "assets/images/" +
                                                                                                                masterDatas[x].proofs[ppp],
                                                                                                            type: 'picture',
                                                                                                            position: {
                                                                                                                type: 'twoCellAnchor',

                                                                                                                from: {
                                                                                                                    col: (19 + ppp + maxLenofScratchImages),
                                                                                                                    // colOff: '-2mm',
                                                                                                                    row: (x + 2),
                                                                                                                    // rowOff: 0
                                                                                                                },
                                                                                                                to: {
                                                                                                                    col: (19 + ppp + 1 + maxLenofScratchImages),
                                                                                                                    // colOff: 0,
                                                                                                                    row: (x + 3),
                                                                                                                    // rowOff: 0
                                                                                                                }
                                                                                                            }
                                                                                                        });*/
                                                                                                        var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].proofs[ppp];
                                                                                                        if (venueIDs == 'All Account')
                                                                                                            excellData.cell((x + 7), (26 + ppp + maxLenofScratchImages)).link(_temp)
                                                                                                        else
                                                                                                            excellData.cell((x + 7), (25 + ppp + maxLenofScratchImages)).link(_temp)
                                                                                                        ppp++;
                                                                                                        writeEachColumnProofsData(ppp);
                                                                                                    } else {
                                                                                                        ppp++;
                                                                                                        writeEachColumnProofsData(ppp);
                                                                                                    }
                                                                                                });
                                                                                            }

                                                                                        } else if (err.code == 'ENOENT') {
                                                                                            // file does not exist
                                                                                            fs.writeFile('log.txt', 'Some log\n');
                                                                                            ppp++;
                                                                                            writeEachColumnProofsData(ppp);
                                                                                        } else {
                                                                                            console.log('Some other error: ', err.code);
                                                                                            ppp++;
                                                                                            writeEachColumnProofsData(ppp);
                                                                                        }
                                                                                    });
                                                                            } else {
                                                                                x++;
                                                                                toWriteRowinExcell(x);
                                                                            }

                                                                        } else {
                                                                            x++;
                                                                            toWriteRowinExcell(x);
                                                                        }
                                                                    }
                                                                }
                                                            } else {
                                                                x++;
                                                                toWriteRowinExcell(x);
                                                            }

                                                        }
                                                    } else {
                                                        wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                                            console.log('Excel.xlsx written and has the following stats');
                                                            // res.send(newDate + ".xlsx");
                                                            done(newDate + ".xlsx");
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // res.send("no.xlsx");
            done("no.xlsx");
        }
    },
    convertDataforExcellFormat: function(masterData, fromDate, toDate, done) {
        var obj = {};
        var masterDatas = [];
        masterAllReport(0);

        function masterAllReport(j) {
            if (j < masterData.length) {
                // if ((new Date(masterData[j].createdAt).getTime() >= fromDate) && (new Date(masterData[j].createdAt).getTime() <= toDate)) {
                    obj = {};
                    if(masterData[j].accountID && masterData[j].accountID.timeZone)
                        timezone = masterData[j].accountID.timeZone;
                    else 
                        timezone = "Asia/Kolkata";
                    obj.Sino = (masterDatas.length) + 1;
                    // console.log("\n\n\n\n\n\n\n\n\n" + JSON.stringify(masterData[j]) + "\n\n\n\n\n\n\n\n\n")
                    if (masterData[j].accountID)
                        obj.AccountName = masterData[j].accountID.accountName;
                    else
                        obj.AccountName = '';
                    if (masterData[j].venue) {
                        obj.Venuename = masterData[j].venue.venueName;
                    }
                    obj.Date = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                    obj.TokenNumber = masterData[j].parkingID;
                    obj.plateNumber = masterData[j].plateNumber;
                    obj.brand = masterData[j].brand;
                    obj.modelName = masterData[j].modelName;
                    obj.color = masterData[j].color;
                    obj.remarks = masterData[j].remarks;
                    if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                        obj.plateSnap = 'noImage';
                    else
                        obj.plateSnap = masterData[j].snap;
                    obj.scratchesSnap = masterData[j].scratchesSnap;


                    if(masterData[j].documents && masterData[j].documents.length > 0)
                        obj.documents = masterData[j].documents; 

                    getData(0);

                    function getData(l) {
                        if (l < masterData[j].log.length) {
                            if (masterData[j].log[l].activity == 'parked') {
                                obj.ParkedAt = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                                obj.ParkedBy = masterData[j].log[l].employeeName;
                                ///
                                // if( masterData[j].documents && masterData[j].documents.length > 0)
                                    // obj.proofs = masterData[j].documents; 
                                /// 
                            }
                            if (masterData[j].log[l].activity == 'requested') {
                                obj.RequestedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.RequestedBy = masterData[j].log[l].by;
                                if(masterData[j].log[l].specialRequest){
                                    obj.MoreDetails = "Required At : " + moment.utc(masterData[j].log[l].specialRequest.dateTime).tz(timezone).format(momentDateformat) + "\nConfirmed By : " + (masterData[j].log[l].specialRequest.accepted ? obj.ConfirmedBy = (masterData[j].log[l].specialRequest.by.employeeName.toString().substring(0, 1).toUpperCase() + masterData[j].log[l].specialRequest.by.employeeName.toString().substring(1)) : 'Yet to confirm') + "\nConfirmed At : " + (masterData[j].log[l].specialRequest.accepted ? moment.utc(masterData[j].log[l].specialRequest.by.at).tz(timezone).format(momentDateformat) : 'Yet to confirm') + " \n\n";
                                }
                            }
                            if (masterData[j].log[l].activity == 'accept') {
                                obj.AcceptedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.AcceptedBy = masterData[j].log[l].employeeName;
                            }
                            if (masterData[j].log[l].activity == 'completed') {
                                obj.completedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.completedBy = masterData[j].log[l].employeeName;
                                /////
                                var startTime = moment.utc(masterData[j].createdAt).tz(timezone);
                                var endTime = moment.utc(masterData[j].log[l].at).tz(timezone);
                                var duration = moment.duration(endTime.diff(startTime));
                                var hours = parseInt(duration.asHours());
                                var minutes = parseInt(duration.asMinutes())-hours*60;
                                obj.diff = hours + ' hours and '+ minutes+' minutes.';

                                if(masterData[j].log[l].cashierName)
                                    obj.cashierName = masterData[j].log[l].cashierName

                                if(masterData[j].log[l].fees)
                                    obj.fees = masterData[j].log[l].fees
                                ////
                            }
                            if (masterData[j].log[l].activity == 'ready') {
                                obj.ReadyAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.ReadyBy = masterData[j].log[l].employeeName;
                            }
                            if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                                if (masterData[j].log[l].proofs.length > 0) {
                                    obj.cardMissed = 'yes';
                                    obj.name = masterData[j].log[l].missedUserName;

                                   

                                    obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                    // console.log(">>>>>>>>>>>>>> -" +  masterData[j].parkingID)
                                    // if(masterData[j].documents && masterData[j].documents.length > 0){
                                    //     console.log("before -" +   obj.proofs)
                                    //     var ___a = obj.proofs, ___b = masterData[j].log[l].proofs;
                                    //     ___a.push.apply(___a, ___b);
                                    //     obj.proofs = ___a;
                                    //     console.log("After---" +   obj.proofs)
                                    // }
                                    // else {
                                        obj.proofs = masterData[j].log[l].proofs;
                                        // console.log("---=======" +   obj.proofs)    
                                    // }
                                }
                            }
                            l++;
                            getData(l);
                        } else {
                            if (!masterData[j].changeLog)
                                masterData[j].changeLog = [];
                            var changeLogs = []
                            getChangeLogData(0);

                            function getChangeLogData(cl) {
                                if (cl < masterData[j].changeLog.length) {
                                    if (masterData[j].changeLog[cl]) {
                                        changeLogs = _.union(changeLogs, masterData[j].changeLog[cl].log);
                                        setTimeout(() => {
                                            cl++;
                                            getChangeLogData(cl);
                                        },1);
                                    } else {
                                        setTimeout(() => {
                                            cl++;
                                            getChangeLogData(cl);
                                        },1);
                                    }
                                } else {
                                    // console.log(JSON.stringify(changeLogs))
                                    changeLogs = _.sortBy(changeLogs, function(obj) {
                                        return obj.at;
                                    });
                                    makinglogColumn(0);

                                    function makinglogColumn(col) {
                                        if (col < changeLogs.length) {
                                            if (changeLogs[col].activity && changeLogs[col].loginUser) {
                                                if (changeLogs[col].activity != "parkingID")
                                                    changeLogs[col].activity = changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1);
                                                else
                                                    changeLogs[col].activity = 'Ticket Number';
                                                changeLogs[col].at = moment.utc(changeLogs[col].at).tz(timezone).format(momentDateformat);
                                                if (obj.changeLogs) {
                                                    obj.changeLogs += "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + " (" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                } else {
                                                    obj.changeLogs = "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + "(" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                }
                                            }
                                            col++;
                                            makinglogColumn(col);
                                        } else {

                                            var a = obj.proofs, b =  obj.documents;
                                            if(a){
                                                a.push.apply(a, b);
                                                obj.proofs = a;
                                            }else {
                                                obj.proofs = b;
                                            }
                                            masterDatas.push(obj);
                                            j++;
                                            masterAllReport(j);
                                        }
                                    }
                                }
                            }
                        }
                    }
                // } else {
                    // j++;
                    // masterAllReport(j);
                // }
            } else {
                done(masterDatas);
            }
        }
    },
    convertDataforExcellFormatforAdmin: function(masterData, fromDate, toDate, done) {
        var obj = {};
        var masterDatas = [];
        masterAllReport(0);

        function masterAllReport(j) {
            if (j < masterData.length) {
                obj = {};
                if(masterData[j].accountID && masterData[j].accountID.timeZone)
                    timezone = masterData[j].accountID.timeZone;
                else 
                    timezone = "Asia/Kolkata";
                obj.Sino = (masterDatas.length) + 1;
                // console.log("\n\n\n\n\n\n\n\n\n" + JSON.stringify(masterData[j]) + "\n\n\n\n\n\n\n\n\n")
                if (masterData[j].accountID)
                    obj.AccountName = masterData[j].accountID.accountName;
                else
                    obj.AccountName = '';
                if (masterData[j].venue) {
                    obj.Venuename = masterData[j].venue.venueName;
                }
                obj.Date = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                obj.TokenNumber = masterData[j].parkingID;
                obj.plateNumber = masterData[j].plateNumber;
                obj.brand = masterData[j].brand;
                obj.modelName = masterData[j].modelName;
                obj.color = masterData[j].color;
                obj.remarks = masterData[j].remarks;
                if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                    obj.plateSnap = 'noImage';
                else
                    obj.plateSnap = masterData[j].snap;
                obj.scratchesSnap = masterData[j].scratchesSnap;

                getData(0);

                function getData(l) {
                    if (l < masterData[j].log.length) {
                        if (masterData[j].log[l].activity == 'parked') {
                            obj.ParkedAt = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                            obj.ParkedBy = masterData[j].log[l].employeeName;
                        }
                        if (masterData[j].log[l].activity == 'requested') {
                            obj.RequestedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                            obj.RequestedBy = masterData[j].log[l].by;
                            if(masterData[j].log[l].specialRequest){
                                obj.MoreDetails = "Required At : " + moment.utc(masterData[j].log[l].specialRequest.dateTime).tz(timezone).format(momentDateformat) + "\nConfirmed By : " + (masterData[j].log[l].specialRequest.accepted ? obj.ConfirmedBy = (masterData[j].log[l].specialRequest.by.employeeName.toString().substring(0, 1).toUpperCase() + masterData[j].log[l].specialRequest.by.employeeName.toString().substring(1)) : 'Yet to confirm') + "\nConfirmed At : " + (masterData[j].log[l].specialRequest.accepted ? moment.utc(masterData[j].log[l].specialRequest.by.at).tz(timezone).format(momentDateformat) : 'Yet to confirm') + " \n\n";
                            }
                        }
                        if (masterData[j].log[l].activity == 'accept') {
                            obj.AcceptedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                            obj.AcceptedBy = masterData[j].log[l].employeeName;
                        }
                        if (masterData[j].log[l].activity == 'completed') {
                            obj.completedAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                            obj.completedBy = masterData[j].log[l].employeeName;
                        }
                        if (masterData[j].log[l].activity == 'ready') {
                            obj.ReadyAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                            obj.ReadyBy = masterData[j].log[l].employeeName;
                        }
                        if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                            if (masterData[j].log[l].proofs.length > 0) {
                                obj.cardMissed = 'yes';
                                obj.name = masterData[j].log[l].missedUserName;
                                obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                obj.proofs = masterData[j].log[l].proofs;
                            }
                        }
                        l++;
                        getData(l);
                    } else {
                        if (!masterData[j].changeLog)
                            masterData[j].changeLog = [];
                        var changeLogs = []
                        getChangeLogData(0);

                        function getChangeLogData(cl) {
                            if (cl < masterData[j].changeLog.length) {
                                if (masterData[j].changeLog[cl]) {
                                    changeLogs = _.union(changeLogs, masterData[j].changeLog[cl].log);
                                    setTimeout(() => {
                                        cl++;
                                        getChangeLogData(cl);
                                    },1);
                                } else {
                                    setTimeout(() => {
                                        cl++;
                                        getChangeLogData(cl);
                                    },1);
                                }
                            } else {
                                // console.log(JSON.stringify(changeLogs))
                                changeLogs = _.sortBy(changeLogs, function(obj) {
                                    return obj.at;
                                });
                                makinglogColumn(0);

                                function makinglogColumn(col) {
                                    if (col < changeLogs.length) {
                                        if (changeLogs[col].activity && changeLogs[col].loginUser) {
                                            if (changeLogs[col].activity != "parkingID")
                                                changeLogs[col].activity = changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1);
                                            else
                                                changeLogs[col].activity = 'Ticket Number';
                                            changeLogs[col].at = moment.utc(changeLogs[col].at).tz(timezone).format(momentDateformat);
                                            if (obj.changeLogs) {
                                                obj.changeLogs += "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + " (" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                            } else {
                                                obj.changeLogs = ''; //= "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + "(" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                            }
                                        }
                                        col++;
                                        makinglogColumn(col);
                                    } else {
                                        masterDatas.push(obj);
                                        j++;
                                        masterAllReport(j);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                done(masterDatas);
            }
        }
    },
    /**
     * 
     * 
     *    Dynamic Excel Creation
     * 
     * 
     */
    exportXLSforDynamic: function(masterDatas, venueIDs, fromDate, toDate, formattedData, done) {
        if(formattedData && formattedData.length > 0)
            originalFormatedData = formattedData
        else {
            var originalFormatedData = [
                {
                    'name': 'all',
                    'displayName': 'All',
                    'selected': true
                },
                {
                    'name': 'Sino',
                    'displayName': 'Sino',
                    'selected': true
                },
                {
                    'name': 'Venuename',
                    'displayName': 'Venue Name',
                    'selected': true
                },
                {
                    'name': 'Date',
                    'displayName': 'Arrival Date/Time',
                    'selected': true
                },
                {
                    'name': 'TokenNumber',
                    'displayName': 'Token Number',
                    'selected': true
                },
                {
                    'name': 'emirates',
                    'displayName': 'Emirates',
                    'selected': false
                },
                {
                    'name': 'plateNumber',
                    'displayName': 'Plate Number',
                    'selected': true
                },
                {
                    'name': 'plateSnap',
                    'displayName': 'Plate Snap',
                    'selected': true
                },
                {
                    'name': 'brand',
                    'displayName': 'Brand',
                    'selected': true
                },
                {
                    'name': 'modelName',
                    'displayName': 'Model Name',
                    'selected': true
                },
                {
                    'name': 'color',
                    'displayName': 'Color',
                    'selected': true
                },
                {
                    'name': 'customerType',
                    'displayName': 'Customer Type',
                    'selected': true
                },
                {
                    'name': 'remarks',
                    'displayName': 'General Remarks',
                    'selected': true
                },
                {
                    'name': 'ParkedAtDateTime',
                    'displayName': 'Parked At',
                    'selected': true
                },
                {
                    'name': 'ParkedAtDate',
                    'displayName': 'Pared Date',
                    'selected': false
                },
                {
                    'name': 'ParkedAtTime',
                    'displayName': 'Pared Time',
                    'selected': false
                },
                {
                    'name': 'ParkedBy',
                    'displayName': 'Parked By',
                    'selected': true
                },
                
                {
                    'name': 'validatedBy',
                    'displayName': 'validated info',
                    'selected': false
                },

                {
                    'name': 'cashAcceptedBy',
                    'displayName': 'Fee collected info',
                    'selected': false
                },

                {
                    'name': 'RequestedAtDateTime',
                    'displayName': 'Requested At',
                    'selected': true
                },
                {
                    'name': 'RequestedAtDate',
                    'displayName': 'Requested Date',
                    'selected': false
                },
                {
                    'name': 'RequestedAtTime',
                    'displayName': 'Requested Time',
                    'selected': false
                },
                {
                    'name': 'RequestedBy',
                    'displayName': 'Requested By',
                    'selected': true
                },
                {
                    'name': 'RequestedLater',
                    'displayName': 'Requested Later',
                    'selected': true
                },
                {
                    'name': 'MoreDetails',
                    'displayName': 'More Details',
                    'selected': true
                },
                {
                    'name': 'AcceptedAtDateTime',
                    'displayName': 'Accepted At',
                    'selected': true
                },
                {
                    'name': 'AcceptedAtDate',
                    'displayName': 'Accepted Date',
                    'selected': false
                },
                {
                    'name': 'AcceptedAtTime',
                    'displayName': 'Accepted Time',
                    'selected': false
                },
                {
                    'name': 'AcceptedBy',
                    'displayName': 'Accepted By',
                    'selected': true
                },
                {
                    'name': 'CompletedAtDateTime',
                    'displayName': 'Completed At',
                    'selected': true
                },
                {
                    'name': 'CompletedAtDate',
                    'displayName': 'Completed Date',
                    'selected': true
                },
                {
                    'name': 'CompletedAtTime',
                    'displayName': 'Completed Time',
                    'selected': true
                },
                {
                    'name': 'CompletedBy',
                    'displayName': 'Completed By',
                    'selected': true
                },
                
                {
                    'name': 'revalidatedBy',
                    'displayName': 'Revalidated By',
                    'selected': false
                },
                
                {
                    'name': 'cardMissed',
                    'displayName': 'Evaletz Card Missed',
                    'selected': true
                },
                {
                    'name': 'name',
                    'displayName': 'Name',
                    'selected': true
                },
                {
                    'name': 'mobileNumber',
                    'displayName': 'Mobile Number',
                    'selected': true
                },
                {
                    'name': 'changeLogs',
                    'displayName': 'ChangeLogs',
                    'selected': true
                },
                {
                    'name': 'cashierName',
                    'displayName': 'Cashier Name',
                    'selected': false
                },
                {
                    'name': 'paymentType',
                    'displayName': 'Payment Type',
                    'selected': false
                },
                {
                    'name': 'fees',
                    'displayName': 'Fees',
                    'selected': false
                },
                {
                    'name': 'documents',
                    'displayName': 'Documents',
                    'selected': false
                },
                {
                    'name': 'description',
                    'displayName': 'Fees Description',
                    'selected': false
                },
                {
                    'name': 'diff',
                    'displayName': 'Duration',
                    'selected': true
                },
                {
                    'name': 'scratchesSnap',
                    'displayName': 'Camera Captures',
                    'selected': true
                },
                {
                    'name': 'proofs',
                    'displayName': 'Proofs',
                    'selected': true
                }
            ];
        }
        
        var excellFormatedData = _.filter(originalFormatedData, (c)=> {
            return (c.selected == true && c.name !='all');
        });

        if (masterDatas.length > 0) {
            var newDate = new Date().getTime();
            // var maxLenofScratchImages = 0;
            // var maxLenofProofs = 0;

            generateWorkbook();

            function generateWorkbook() {
                var wb = new xl.Workbook();
                ////////////////////// Static ////////////////////
                var excellData = wb.addWorksheet('Report', {
                    pageSetup: {
                        fitToWidth: 1
                    },
                    headerFooter: {
                        oddHeader: '',
                        oddFooter: ''
                    }
                });
                var largeText = wb.createStyle({
                    font: {
                        name: 'Cambria',
                        size: 20
                    }
                });
                excellData.column(2).setWidth(25);
                excellData.row(2).setHeight(25);
                excellData.column(3).setWidth(25);
                excellData.column(5).setWidth(25);
                ////////////////////// Static ////////////////////

                

                function writeHeaderforExcel(callbackFunction1){
                    gettingExcellCellByCell(0);

                    function gettingExcellCellByCell(cell){
                        if(cell < excellFormatedData.length){
                            if(excellFormatedData[cell].name == "all"){
                                cell++;
                                gettingExcellCellByCell(cell);
                            } else {
                                excellData.cell(6, (cell + 1)).string(excellFormatedData[cell].displayName).style({ font: { bold: true } });
                                cell++;
                                gettingExcellCellByCell(cell);
                            }
                        }
                        else 
                            callbackFunction1('success');
                    }
                }


                

                writeHeaderforExcel((data) => {
                        toWriteRowinExcell(0);

                        function toWriteRowinExcell(x) {
                            if (x < masterDatas.length) {
                                ////////////////////// Static ////////////////////
                                excellData.cell(2, 2).string(masterDatas[x].AccountName.toUpperCase()).style(largeText);
                                
                                if(fromDate == '' && toDate == ''){
                                    excellData.cell(4, 2, 4, 3, true).string('Today Report : ' + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY") + "  To :  " + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY")).style({
                                        font: {
                                            bold: true
                                        }
                                    });
                                } else 
                                excellData.cell(4, 2, 4, 3, true).string('Report From : ' + moment(fromDate).format("DD-MM-YYYY")  + "  To :  " + moment(toDate).format("DD-MM-YYYY") ).style({ font: { bold: true } });

                                if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                                    excellData.cell(4, 4, 4, 5, true).string('Venue : All').style({ font: { bold: true } });
                                else 
                                    excellData.cell(4, 4, 4, 5, true).string('Venue :' +  masterDatas[x].Venuename).style({ font: { bold: true } });
                                ////////////////////// Static ////////////////////
                                
                                writeContentforExcel();

                                function writeContentforExcel(){
                                    gettingExcellCellByCell1(0);

                                    function gettingExcellCellByCell1(cell){
                                        if(cell < excellFormatedData.length){                                            
                                            if(excellFormatedData[cell].name == 'all'){
                                                setTimeout(() => { 
                                                    cell++;
                                                    gettingExcellCellByCell1(cell);
                                                },1);
                                            } else {
                                                ///////////////////////
                                                // if(excellFormatedData[cell].name == '')
                                                // if (masterDatas[x][excellFormatedData[cell].name] != undefined)
                                                //     excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x][excellFormatedData[cell].name].toString());
                                                ///////////////////////
                                                if(excellFormatedData[cell].name == 'Sino')
                                                excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].Sino)
                                            
                                                if(excellFormatedData[cell].name == 'Venuename'){
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].Venuename)
                                                    // console.log(masterDatas[x].Venuename  + "----------------");
                                                }

                                                if(excellFormatedData[cell].name == 'Date')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].Date));

                                                if(excellFormatedData[cell].name == 'TokenNumber')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].TokenNumber)

                                                if(excellFormatedData[cell].name == 'plateNumber')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].plateNumber.toUpperCase())
                                                
                                                if (excellFormatedData[cell].name == 'plateSnap' && masterDatas[x].plateSnap != 'noImage') {
                                                    var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                                    excellData.cell((x + 7), (cell+1)).link(_temp);
                                                }

                                                if (masterDatas[x].brand != undefined && excellFormatedData[cell].name == 'brand')
                                                    excellData.cell((x + 7), (cell+1)).string(masterDatas[x].brand)
                                                if (masterDatas[x].modelName != undefined && excellFormatedData[cell].name == 'modelName')
                                                    excellData.cell((x + 7), (cell+1)).string(masterDatas[x].modelName)
                                                if (masterDatas[x].color != undefined && excellFormatedData[cell].name == 'color')
                                                    excellData.cell((x + 7), (cell+1)).string(masterDatas[x].color)


                                                if (masterDatas[x].customerType != undefined && excellFormatedData[cell].name == 'customerType')
                                                    excellData.cell((x + 7), (cell+1)).string(masterDatas[x].customerType)
                                                if (masterDatas[x].remarks != undefined && excellFormatedData[cell].name == 'remarks')
                                                    excellData.cell((x + 7), (cell+1)).string(masterDatas[x].remarks)
                                                /////////////
                                                if (masterDatas[x].ParkedAtDateTime != undefined && excellFormatedData[cell].name == 'ParkedAtDateTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDateTime))
                                                if (masterDatas[x].ParkedAtDate != undefined && excellFormatedData[cell].name == 'ParkedAtDate')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDate))
                                                if (masterDatas[x].ParkedAtTime != undefined && excellFormatedData[cell].name == 'ParkedAtTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtTime))
                                                if (masterDatas[x].ParkedBy != undefined && excellFormatedData[cell].name == 'ParkedBy')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].ParkedBy)
                                                /////////////////
                                                if (masterDatas[x].RequestedAtDateTime != undefined && excellFormatedData[cell].name == 'RequestedAtDateTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDateTime))
                                                if (masterDatas[x].RequestedAtDate != undefined && excellFormatedData[cell].name == 'RequestedAtDate')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDate))
                                                if (masterDatas[x].RequestedAtTime != undefined && excellFormatedData[cell].name == 'RequestedAtTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtTime))
                                                if (masterDatas[x].RequestedBy != undefined && excellFormatedData[cell].name == 'RequestedBy')
                                                    excellData.cell((x + 7), (cell+1)).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));
                                                ////////////
                                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'RequestedLater')
                                                    excellData.cell((x + 7), (cell+1)).string("Yes") // requested car later 
                                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'MoreDetails')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].MoreDetails)
                                                //////////////
                                                if (masterDatas[x].AcceptedAtDateTime != undefined && excellFormatedData[cell].name == 'AcceptedAtDateTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDateTime)
                                                if (masterDatas[x].AcceptedAtDate != undefined && excellFormatedData[cell].name == 'AcceptedAtDate')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDate)
                                                if (masterDatas[x].AcceptedAtTime != undefined && excellFormatedData[cell].name == 'AcceptedAtTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtTime)
                                                if (masterDatas[x].AcceptedBy != undefined && excellFormatedData[cell].name == 'AcceptedBy')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].AcceptedBy)
                                                /////////////////
                                                if (masterDatas[x].CompletedAtDateTime != undefined && excellFormatedData[cell].name == 'CompletedAtDateTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDateTime)
                                                if (masterDatas[x].CompletedAtDate != undefined && excellFormatedData[cell].name == 'CompletedAtDate')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDate)
                                                if (masterDatas[x].CompletedAtTime != undefined && excellFormatedData[cell].name == 'CompletedAtTime')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].CompletedAtTime)
                                                if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'CompletedBy')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].CompletedBy)
                                                ////////////////
                                                if (masterDatas[x].cardMissed == 'yes' ) {
                                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'cardMissed')
                                                        excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].cardMissed)
                                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'name')
                                                        excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].name)
                                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'mobileNumber')
                                                        excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].mobileNumber)
                                                }
                                                if (masterDatas[x].changeLogs != undefined && excellFormatedData[cell].name == 'changeLogs')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].changeLogs)
                                                ////////////
                                                if (masterDatas[x].cashierName != undefined && excellFormatedData[cell].name == 'cashierName')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].cashierName)
                                                if (masterDatas[x].fees != undefined && excellFormatedData[cell].name == 'fees')
                                                    excellData.cell((x + 7), (cell+1)).number(parseInt(masterDatas[x].fees))
                                                    
                                                if (masterDatas[x].description != undefined && excellFormatedData[cell].name == 'description')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].description)
                                                //////////////////
                                                if (masterDatas[x].diff != undefined && excellFormatedData[cell].name == 'diff')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].diff)
                                                /////////////////
                                                if (masterDatas[x].proofs != undefined && excellFormatedData[cell].name == 'proofs')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].proofs)
                                                if (masterDatas[x].documents != undefined && excellFormatedData[cell].name == 'documents')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].documents)
                                                if (masterDatas[x].scratchesSnap != undefined && excellFormatedData[cell].name == 'scratchesSnap')
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].scratchesSnap)
                                                ///////////////////////

                                                //// Validation 
                                                if(excellFormatedData[cell].name == 'validatedBy' && masterDatas[x].validatedBy)
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].validatedBy);
                                                /// cash collcected info
                                                if(excellFormatedData[cell].name == 'cashAcceptedBy' && masterDatas[x].cashAcceptedBy)
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].cashAcceptedBy);
                                                ///////////////////

                                                //// Revalidation 
                                                if(excellFormatedData[cell].name == 'revalidatedBy' && masterDatas[x].revalidatedBy)
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].revalidatedBy);
                                                ///////////////////

                                                if(excellFormatedData[cell].name == 'paymentType' && masterDatas[x].paymentType)
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].paymentType);

                                                if(excellFormatedData[cell].name == 'emirates' && masterDatas[x].emirates)
                                                    excellData.cell((x + 7), (cell+1)).string("" + masterDatas[x].emirates);

                                                ///////////////////// Ready State
                                                if(excellFormatedData[cell].name == 'ReadyAtDateTime' && masterDatas[x].ReadyAtDateTime)
                                                    excellData.cell((x  + 7), (cell+1)).string("" + masterDatas[x].ReadyAtDateTime);

                                                if(excellFormatedData[cell].name == 'ReadydBy' && masterDatas[x].ReadydBy)
                                                    excellData.cell((x  + 7), (cell+1)).string("" + masterDatas[x].ReadydBy);
                                                
                                                if(excellFormatedData[cell].name == 'ReadyAtDate' && masterDatas[x].ReadyAtDate)
                                                    excellData.cell((x  + 7), (cell+1)).string("" + masterDatas[x].ReadyAtDate);

                                                if(excellFormatedData[cell].name == 'ReadyAtTime' && masterDatas[x].ReadyAtTime)
                                                    excellData.cell((x  + 7), (cell+1)).string("" + masterDatas[x].ReadyAtTime);

                                                    setTimeout(() => { 
                                                        cell++;
                                                        gettingExcellCellByCell1(cell);
                                                    },1);
                                                }
                                        }
                                        else {
                                            // setTimeout(() => {
                                                x++
                                                toWriteRowinExcell(x);
                                            // },1);
                                        }
                                    }
                                }
                            } else {
                                wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                                    console.log('Excel.xlsx written and has the following stats');
                                    done(newDate + ".xlsx");
                                });
                            }
                        }
                });
            }
        } else {
            // res.send("no.xlsx");
            done("no.xlsx");
        }
    },
    convertDataforExcellFormatforDynamic : function(masterData, fromDate, toDate, formattedData,  done) {
        var obj = {};
        var masterDatas = [];
        masterAllReport(0);

        function masterAllReport(j) {
            if (j < masterData.length) {
                    obj = {};
                    if(masterData[j].accountID && masterData[j].accountID.timeZone)
                        timezone = masterData[j].accountID.timeZone;
                    else 
                        timezone = "Asia/Kolkata";
                    obj.Sino = (masterDatas.length) + 1;
                    // console.log("\n\n\n\n\n\n\n\n\n" + JSON.stringify(masterData[j]) + "\n\n\n\n\n\n\n\n\n")
                    if (masterData[j].accountID)
                        obj.AccountName = masterData[j].accountID.accountName;
                    else
                        obj.AccountName = '';
                    if (masterData[j].venue) {
                        obj.Venuename = masterData[j].venue.venueName;
                    }
                    obj.Date = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                    obj.timezone = timezone;
                    obj.TokenNumber = masterData[j].parkingID;
                    obj.plateNumber = masterData[j].plateNumber;
                    obj.brand = masterData[j].brand;
                    obj.modelName = masterData[j].modelName;
                    obj.color = masterData[j].color;
                    obj.remarks = masterData[j].remarks;
                    obj.customerType = masterData[j].customerType;
                    obj.description = masterData[j].description;
                    
                    obj.emirates =  masterData[j].emirates;

                    if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                        obj.plateSnap = 'noImage';
                    else
                        obj.plateSnap = masterData[j].snap;


                    obj.scratchesSnap = _.map(masterData[j].scratchesSnap,(p)=>{
                        p = ( "\nhttps://evaletz.com:2018/images/" + p);
                        return p;
                    }).toString();

                    if(masterData[j].documents && masterData[j].documents.length > 0){
                        obj.documents = _.map(masterData[j].documents ,(p)=>{
                            p = ( "\nhttps://evaletz.com:2018/images/" + p);
                            return p;
                        }).toString();
                    }

                    if(masterData[j].validatedBy){
                        if(masterData[j].validatedBy.userName)
                         masterData[j].validatedBy.userName = (masterData[j].validatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.userName.toString().substring(1));
                        // masterData[j].validatedBy.role = (masterData[j].validatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.role.toString().substring(1));
                        // if(masterData[j].validatedBy.validationType)
                        //     masterData[j].validatedBy.validationType = (masterData[j].validatedBy.validationType.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.validationType.toString().substring(1));
                        // if(masterData[j].validatedBy.outletName)
                        //     masterData[j].validatedBy.outletName = (masterData[j].validatedBy.outletName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.outletName.toString().substring(1));
                        // else 
                        //     masterData[j].validatedBy.outletName = '-';

                        obj.validatedBy = masterData[j].validatedBy.userName;
                        // obj.validatedBy = "Validated By :" + masterData[j].validatedBy.userName  + "(" + masterData[j].validatedBy.email + ") \nRole : " +  masterData[j].validatedBy.role  + " ("+ masterData[j].validatedBy.validationType +") \nOutlet : " + masterData[j].validatedBy.outletName + " @ " +  moment.utc(obj.validatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }

                    if(masterData[j].cashAcceptedBy){
                        if(masterData[j].cashAcceptedBy.userName)
                        masterData[j].cashAcceptedBy.userName = (masterData[j].cashAcceptedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.userName.toString().substring(1));
                        // masterData[j].cashAcceptedBy.role = (masterData[j].cashAcceptedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.role.toString().substring(1));

                        // if(!masterData[j].cashAcceptedBy.validationType)
                        //     masterData[j].cashAcceptedBy.validationType = "-";

                        // obj.cashierName = masterData[j].cashAcceptedBy.userName;
                        obj.cashAcceptedBy = masterData[j].cashAcceptedBy.userName || '';
                        // obj.cashAcceptedBy = "Cash collected By :" + masterData[j].cashAcceptedBy.userName  + "(" + masterData[j].cashAcceptedBy.email + ") \nRole : " +  masterData[j].cashAcceptedBy.role  + " ("+ masterData[j].cashAcceptedBy.validationType +") \n @ " +  moment.utc(obj.cashAcceptedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   
                    
                    
                    if(masterData[j].revalidatedBy){
                        if(masterData[j].revalidatedBy.userName)
                        masterData[j].revalidatedBy.userName = (masterData[j].revalidatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.userName.toString().substring(1));
                        // masterData[j].revalidatedBy.role = (masterData[j].revalidatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.role.toString().substring(1));

                        // if(!masterData[j].revalidatedBy.validationType)
                        //     masterData[j].revalidatedBy.validationType = "-";
                        obj.revalidatedBy =  masterData[j].revalidatedBy.userName || '';
                        // obj.revalidatedBy = "Cash recollected By :" + masterData[j].revalidatedBy.userName  + "(" + masterData[j].revalidatedBy.email + ") \nRole : " +  masterData[j].revalidatedBy.role  + " ("+ masterData[j].revalidatedBy.validationType +") \n @ " +  moment.utc(obj.revalidatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   

                    if(masterData[j].feeSplitUp)
                        masterData[j].feeSplitUp.paymentType ? obj.paymentType = masterData[j].feeSplitUp.paymentType : null;

                    getData(0);

                    function getData(l) {
                        if (l < masterData[j].log.length) {
                            if (masterData[j].log[l].activity == 'parked') {
                                obj.ParkedAtDateTime = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                                obj.ParkedBy = masterData[j].log[l].employeeName;

                                obj.ParkedAtDate = moment.utc(masterData[j].createdAt).tz(timezone).format("DD/MM/YYYY");
                                obj.ParkedAtTime = moment.utc(masterData[j].createdAt).tz(timezone).format("HH:mm");

                            }
                            if (masterData[j].log[l].activity == 'requested') {
                                obj.RequestedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.RequestedBy = masterData[j].log[l].by;

                                obj.RequestedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.RequestedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");

                                if(masterData[j].log[l].specialRequest){
                                    obj.MoreDetails = "Required At : " + moment.utc(masterData[j].log[l].specialRequest.dateTime).tz(timezone).format(momentDateformat) + "\nConfirmed By : " + (masterData[j].log[l].specialRequest.accepted ? obj.ConfirmedBy = (masterData[j].log[l].specialRequest.by.employeeName.toString().substring(0, 1).toUpperCase() + masterData[j].log[l].specialRequest.by.employeeName.toString().substring(1)) : 'Yet to confirm') + "\nConfirmed At : " + (masterData[j].log[l].specialRequest.accepted ? moment.utc(masterData[j].log[l].specialRequest.by.at).tz(timezone).format(momentDateformat) : 'Yet to confirm') + " \n\n";
                                }
                            }
                            if (masterData[j].log[l].activity == 'accept') {
                                obj.AcceptedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.AcceptedBy = masterData[j].log[l].employeeName;

                                obj.AcceptedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.AcceptedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");
                            }
                            if (masterData[j].log[l].activity == 'completed') {
                                obj.CompletedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.CompletedBy = masterData[j].log[l].employeeName;

                                obj.CompletedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.CompletedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");


                                /////
                                var startTime = moment.utc(masterData[j].createdAt).tz(timezone);
                                var endTime = moment.utc(masterData[j].log[l].at).tz(timezone);
                                var duration = moment.duration(endTime.diff(startTime));
                                var hours = parseInt(duration.asHours());
                                var minutes = parseInt(duration.asMinutes())-hours*60;
                                obj.diff = hours + ' hours and '+ minutes+' minutes.';

                                if(masterData[j].log[l].cashierName)
                                    obj.cashierName = masterData[j].log[l].cashierName

                                if(masterData[j].log[l].fees)
                                    obj.fees = masterData[j].log[l].fees

                                ////
                            }
                            if (masterData[j].log[l].activity == 'ready') {
                                // obj.ReadyAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                // obj.ReadyBy = masterData[j].log[l].employeeName;
                                obj.ReadyAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.ReadydBy = masterData[j].log[l].employeeName;

                                obj.ReadyAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.ReadyAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");
                            }
                            if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                                if (masterData[j].log[l].proofs.length > 0) {
                                    obj.cardMissed = 'yes';
                                    obj.name = masterData[j].log[l].missedUserName;
                                    obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                    obj.proofs = _.map(masterData[j].log[l].proofs,(p)=>{
                                        p = ( "\nhttps://evaletz.com:2018/images/" + p)
                                        return p;
                                    }).toString();
                                }
                            }
                            l++;
                            getData(l);
                        } else {
                            if (!masterData[j].changeLog)
                                masterData[j].changeLog = [];
                            var changeLogs = []
                            getChangeLogData(0);

                            function getChangeLogData(cl) {
                                if (cl < masterData[j].changeLog.length) {
                                    if (masterData[j].changeLog[cl]) {
                                        changeLogs = _.union(changeLogs, masterData[j].changeLog[cl].log);
                                        setTimeout(() => {
                                            cl++;
                                            getChangeLogData(cl);
                                        },1);
                                    } else {
                                        setTimeout(() => {
                                            cl++;
                                            getChangeLogData(cl);
                                        },1);
                                    }
                                } else {
                                    // console.log(JSON.stringify(changeLogs))
                                    changeLogs = _.sortBy(changeLogs, function(obj) {
                                        return obj.at;
                                    });
                                    makinglogColumn(0);

                                    function makinglogColumn(col) {
                                        if (col < changeLogs.length) {
                                            if (changeLogs[col].activity && changeLogs[col].loginUser) {
                                                if (changeLogs[col].activity != "parkingID")
                                                    changeLogs[col].activity = changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1);
                                                else
                                                    changeLogs[col].activity = 'Ticket Number';
                                                changeLogs[col].at = moment.utc(changeLogs[col].at).tz(timezone).format(momentDateformat);

                                                if(changeLogs[col].loginUser.userName)
                                                    changeLogs[col].loginUser.userName  = changeLogs[col].loginUser.userName.toString();
                                                else {
                                                    changeLogs[col].loginUser.userName = '';
                                                }

                                                if (obj.changeLogs) {
                                                    obj.changeLogs += "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + " (" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                } else {
                                                    obj.changeLogs = "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + "(" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                }
                                            }
                                            col++;
                                            makinglogColumn(col);
                                        } else {
                                            // var a = obj.proofs, b =  obj.documents;
                                            // if(a){
                                            //     a.push.apply(a, b);
                                            //     obj.proofs = a;
                                            // }else {
                                            //     obj.proofs = b;
                                            // }
                                            masterDatas.push(obj);
                                            j++;
                                            masterAllReport(j);
                                        }
                                    }
                                }
                            }
                        }
                    }
                // } else {
                    // j++;
                    // masterAllReport(j);
                // }
            } else {
                done(masterDatas);
            }
        }
    },
    /**
     * 
     * 
     *    Dynamic Excel Creation Large number of data
     * 
     * 
     */
    exportXLSforDynamicLargeData: function(masterDatas, venueIDs, fromDate, toDate, formattedData, excellData, hydration, limit, largeText ,done) {
        if(formattedData && formattedData.length > 0)
            originalFormatedData = formattedData
        else {
            var originalFormatedData = [
                {
                    'name': 'all',
                    'displayName': 'All',
                    'selected': true
                },
                {
                    'name': 'Sino',
                    'displayName': 'Sino',
                    'selected': true
                },
                {
                    'name': 'Venuename',
                    'displayName': 'Venue Name',
                    'selected': true
                },
                {
                    'name': 'Date',
                    'displayName': 'Arrival Date/Time',
                    'selected': true
                },
                {
                    'name': 'TokenNumber',
                    'displayName': 'Token Number',
                    'selected': true
                },
                {
                    'name': 'emirates',
                    'displayName': 'Emirates',
                    'selected': false
                },
                {
                    'name': 'plateNumber',
                    'displayName': 'Plate Number',
                    'selected': true
                },
                {
                    'name': 'plateSnap',
                    'displayName': 'Plate Snap',
                    'selected': true
                },
                {
                    'name': 'brand',
                    'displayName': 'Brand',
                    'selected': true
                },
                {
                    'name': 'modelName',
                    'displayName': 'Model Name',
                    'selected': true
                },
                {
                    'name': 'color',
                    'displayName': 'Color',
                    'selected': true
                },
                {
                    'name': 'customerType',
                    'displayName': 'Customer Type',
                    'selected': true
                },
                {
                    'name': 'remarks',
                    'displayName': 'General Remarks',
                    'selected': true
                },
                {
                    'name': 'ParkedAtDateTime',
                    'displayName': 'Parked At',
                    'selected': true
                },
                {
                    'name': 'ParkedAtDate',
                    'displayName': 'Pared Date',
                    'selected': false
                },
                {
                    'name': 'ParkedAtTime',
                    'displayName': 'Pared Time',
                    'selected': false
                },
                {
                    'name': 'ParkedBy',
                    'displayName': 'Parked By',
                    'selected': true
                },
                
                {
                    'name': 'validatedBy',
                    'displayName': 'validated info',
                    'selected': false
                },

                {
                    'name': 'cashAcceptedBy',
                    'displayName': 'Fee collected info',
                    'selected': false
                },

                {
                    'name': 'RequestedAtDateTime',
                    'displayName': 'Requested At',
                    'selected': true
                },
                {
                    'name': 'RequestedAtDate',
                    'displayName': 'Requested Date',
                    'selected': false
                },
                {
                    'name': 'RequestedAtTime',
                    'displayName': 'Requested Time',
                    'selected': false
                },
                {
                    'name': 'RequestedBy',
                    'displayName': 'Requested By',
                    'selected': true
                },
                {
                    'name': 'RequestedLater',
                    'displayName': 'Requested Later',
                    'selected': true
                },
                {
                    'name': 'MoreDetails',
                    'displayName': 'More Details',
                    'selected': true
                },
                {
                    'name': 'AcceptedAtDateTime',
                    'displayName': 'Accepted At',
                    'selected': true
                },
                {
                    'name': 'AcceptedAtDate',
                    'displayName': 'Accepted Date',
                    'selected': false
                },
                {
                    'name': 'AcceptedAtTime',
                    'displayName': 'Accepted Time',
                    'selected': false
                },
                {
                    'name': 'AcceptedBy',
                    'displayName': 'Accepted By',
                    'selected': true
                },
                //
                {
                    'name': 'ReadyAtDateTime',
                    'displayName': 'Readied At',
                    'selected': true
                },
                {
                    'name': 'ReadyAtDate',
                    'displayName': 'Readied Date',
                    'selected': true
                },
                {
                    'name': 'ReadyAtTime',
                    'displayName': 'Readied Time',
                    'selected': true
                },
                {
                    'name': 'ReadydBy',
                    'displayName': 'Readied By',
                    'selected': true
                },
                //
                {
                    'name': 'CompletedAtDateTime',
                    'displayName': 'Completed At',
                    'selected': true
                },
                {
                    'name': 'CompletedAtDate',
                    'displayName': 'Completed Date',
                    'selected': true
                },
                {
                    'name': 'CompletedAtTime',
                    'displayName': 'Completed Time',
                    'selected': true
                },
                {
                    'name': 'CompletedBy',
                    'displayName': 'Completed By',
                    'selected': true
                },
                
                {
                    'name': 'revalidatedBy',
                    'displayName': 'Revalidated By',
                    'selected': false
                },
                
                {
                    'name': 'cardMissed',
                    'displayName': 'Evaletz Card Missed',
                    'selected': true
                },
                {
                    'name': 'name',
                    'displayName': 'Name',
                    'selected': true
                },
                {
                    'name': 'mobileNumber',
                    'displayName': 'Mobile Number',
                    'selected': true
                },
                {
                    'name': 'changeLogs',
                    'displayName': 'ChangeLogs',
                    'selected': true
                },
                {
                    'name': 'cashierName',
                    'displayName': 'Cashier Name',
                    'selected': false
                },
                {
                    'name': 'paymentType',
                    'displayName': 'Payment Type',
                    'selected': false
                },
                {
                    'name': 'fees',
                    'displayName': 'Fees',
                    'selected': false
                },
                {
                    'name': 'documents',
                    'displayName': 'Documents',
                    'selected': false
                },
                {
                    'name': 'description',
                    'displayName': 'Fees Description',
                    'selected': false
                },
                {
                    'name': 'diff',
                    'displayName': 'Duration',
                    'selected': true
                },
                {
                    'name': 'scratchesSnap',
                    'displayName': 'Camera Captures',
                    'selected': true
                },
                {
                    'name': 'proofs',
                    'displayName': 'Proofs',
                    'selected': true
                }
            ];
        }
        
        var excellFormatedData = _.filter(originalFormatedData, (c)=> {
            return (c.selected == true && c.name !='all');
        });

        if (masterDatas.length > 0) {
            if(hydration  == 0){
                writeHeaderforExcel((data) => {
                    toWriteRowinExcell(0);
                });
            } else 
                toWriteRowinExcell(0);

            function writeHeaderforExcel(callbackFunction1){
                gettingExcellCellByCell(0);

                function gettingExcellCellByCell(cell){
                    if(cell < excellFormatedData.length){
                        if(excellFormatedData[cell].name == "all"){
                            cell++;
                            gettingExcellCellByCell(cell);
                        } else {
                            excellData.cell(6, (cell + 1)).string(excellFormatedData[cell].displayName).style({ font: { bold: true } });
                            cell++;
                            gettingExcellCellByCell(cell);
                        }
                    }
                    else 
                        callbackFunction1('success');
                }
            }

            function toWriteRowinExcell(x) {
                if (x < masterDatas.length) {
                    ////////////////////// Static ////////////////////
                    excellData.cell(2, 2).string(masterDatas[x].AccountName.toUpperCase()).style(largeText);
                    
                    if(fromDate == '' && toDate == ''){
                        excellData.cell(4, 2, 4, 3, true).string('Today Report : ' + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY") + "  To :  " + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY")).style({
                            font: {
                                bold: true
                            }
                        });
                    } else 
                    excellData.cell(4, 2, 4, 3, true).string('Report From : ' + moment(fromDate).format("DD-MM-YYYY")  + "  To :  " + moment(toDate).format("DD-MM-YYYY") ).style({ font: { bold: true } });

                    if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                        excellData.cell(4, 4, 4, 5, true).string('Venue : All').style({ font: { bold: true } });
                    else 
                        excellData.cell(4, 4, 4, 5, true).string('Venue :' +  masterDatas[x].Venuename).style({ font: { bold: true } });
                    ////////////////////// Static ////////////////////
                    
                    writeContentforExcel();

                    function writeContentforExcel(){
                        gettingExcellCellByCell1(0);

                        function gettingExcellCellByCell1(cell){
                            if(cell < excellFormatedData.length){                                            
                                if(excellFormatedData[cell].name == 'all'){
                                    setTimeout(() => { //
                                        cell++;
                                        gettingExcellCellByCell1(cell);
                                    },1);//
                                } else {

                                if(excellFormatedData[cell].name == 'Sino')
                                excellData.cell(( (x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].Sino)
                            
                                if(excellFormatedData[cell].name == 'Venuename'){
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].Venuename)
                                    // console.log(masterDatas[x].Venuename  + "----------------");
                                }

                                if(excellFormatedData[cell].name == 'Date')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].Date));

                                if(excellFormatedData[cell].name == 'TokenNumber')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].TokenNumber)

                                if(excellFormatedData[cell].name == 'plateNumber')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].plateNumber.toUpperCase())
                                
                                if (excellFormatedData[cell].name == 'plateSnap' && masterDatas[x].plateSnap != 'noImage') {
                                    var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).link(_temp);
                                }

                                if (masterDatas[x].brand != undefined && excellFormatedData[cell].name == 'brand')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].brand)
                                if (masterDatas[x].modelName != undefined && excellFormatedData[cell].name == 'modelName')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].modelName)
                                if (masterDatas[x].color != undefined && excellFormatedData[cell].name == 'color')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].color)


                                if (masterDatas[x].customerType != undefined && excellFormatedData[cell].name == 'customerType')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].customerType)
                                if (masterDatas[x].remarks != undefined && excellFormatedData[cell].name == 'remarks')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].remarks)
                                /////////////
                                if (masterDatas[x].ParkedAtDateTime != undefined && excellFormatedData[cell].name == 'ParkedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDateTime))
                                if (masterDatas[x].ParkedAtDate != undefined && excellFormatedData[cell].name == 'ParkedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDate))
                                if (masterDatas[x].ParkedAtTime != undefined && excellFormatedData[cell].name == 'ParkedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtTime))
                                if (masterDatas[x].ParkedBy != undefined && excellFormatedData[cell].name == 'ParkedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ParkedBy)
                                /////////////////
                                if (masterDatas[x].RequestedAtDateTime != undefined && excellFormatedData[cell].name == 'RequestedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDateTime))
                                if (masterDatas[x].RequestedAtDate != undefined && excellFormatedData[cell].name == 'RequestedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDate))
                                if (masterDatas[x].RequestedAtTime != undefined && excellFormatedData[cell].name == 'RequestedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtTime))
                                if (masterDatas[x].RequestedBy != undefined && excellFormatedData[cell].name == 'RequestedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));
                                ////////////
                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'RequestedLater')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("Yes") // requested car later 
                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'MoreDetails')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].MoreDetails)
                                //////////////
                                if (masterDatas[x].AcceptedAtDateTime != undefined && excellFormatedData[cell].name == 'AcceptedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDateTime)
                                if (masterDatas[x].AcceptedAtDate != undefined && excellFormatedData[cell].name == 'AcceptedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDate)
                                if (masterDatas[x].AcceptedAtTime != undefined && excellFormatedData[cell].name == 'AcceptedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtTime)
                                if (masterDatas[x].AcceptedBy != undefined && excellFormatedData[cell].name == 'AcceptedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedBy)
                                /////////////////
                                if (masterDatas[x].CompletedAtDateTime != undefined && excellFormatedData[cell].name == 'CompletedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDateTime)
                                if (masterDatas[x].CompletedAtDate != undefined && excellFormatedData[cell].name == 'CompletedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDate)
                                if (masterDatas[x].CompletedAtTime != undefined && excellFormatedData[cell].name == 'CompletedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtTime)
                                if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'CompletedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedBy)
                                ////////////////
                                if (masterDatas[x].cardMissed == 'yes' ) {
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'cardMissed')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cardMissed)
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'name')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].name)
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'mobileNumber')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].mobileNumber)
                                }
                                if (masterDatas[x].changeLogs != undefined && excellFormatedData[cell].name == 'changeLogs')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].changeLogs)
                                ////////////
                                if (masterDatas[x].cashierName != undefined && excellFormatedData[cell].name == 'cashierName')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cashierName)
                                if (masterDatas[x].fees != undefined && excellFormatedData[cell].name == 'fees')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).number(parseInt(masterDatas[x].fees))
                                    
                                if (masterDatas[x].description != undefined && excellFormatedData[cell].name == 'description')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].description)
                                //////////////////
                                if (masterDatas[x].diff != undefined && excellFormatedData[cell].name == 'diff')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].diff)
                                /////////////////
                                if (masterDatas[x].proofs != undefined && excellFormatedData[cell].name == 'proofs')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].proofs)
                                if (masterDatas[x].documents != undefined && excellFormatedData[cell].name == 'documents')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].documents)
                                if (masterDatas[x].scratchesSnap != undefined && excellFormatedData[cell].name == 'scratchesSnap')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].scratchesSnap)
                                ///////////////////////

                                //// Validation 
                                if(excellFormatedData[cell].name == 'validatedBy' && masterDatas[x].validatedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].validatedBy);
                                /// cash collcected info
                                if(excellFormatedData[cell].name == 'cashAcceptedBy' && masterDatas[x].cashAcceptedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cashAcceptedBy);
                                ///////////////////

                                //// Revalidation 
                                if(excellFormatedData[cell].name == 'revalidatedBy' && masterDatas[x].revalidatedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].revalidatedBy);
                                ///////////////////

                                if(excellFormatedData[cell].name == 'paymentType' && masterDatas[x].paymentType)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].paymentType);

                                if(excellFormatedData[cell].name == 'emirates' && masterDatas[x].emirates)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].emirates);

                                ///////////////////// Ready State
                                if(excellFormatedData[cell].name == 'ReadyAtDateTime' && masterDatas[x].ReadyAtDateTime)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ReadyAtDateTime);

                                if(excellFormatedData[cell].name == 'ReadydBy' && masterDatas[x].ReadydBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ReadydBy);
                                
                                if(excellFormatedData[cell].name == 'ReadyAtDate' && masterDatas[x].ReadyAtDate)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ReadyAtDate);

                                if(excellFormatedData[cell].name == 'ReadyAtTime' && masterDatas[x].ReadyAtTime)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ReadyAtTime);
                                /////////////////////

                                    setTimeout(() => { //
                                        cell++;
                                        gettingExcellCellByCell1(cell);
                                    },1);//
                                }
                            }
                            else {
                                // setTimeout(() => {
                                    x++
                                    toWriteRowinExcell(x);
                                // },1);
                            }
                        }
                    }
                } else {
                    // wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                    //     console.log('Excel.xlsx written and has the following stats');
                        done(excellData);
                    // });
                }
            }
        } else {
            // res.send("no.xlsx");
            done("no.xlsx");
        }
    },
    convertDataforExcellFormatforDynamicLargeData : function(masterData, fromDate, toDate, formattedData, hydration, limit,  done) {
        var obj = {};
        var masterDatas = [];
        masterAllReport(0);

        function masterAllReport(j) {
            if (j < masterData.length) {
                    obj = {};
                    if(masterData[j].accountID && masterData[j].accountID.timeZone)
                        timezone = masterData[j].accountID.timeZone;
                    else 
                        timezone = "Asia/Kolkata";
                    obj.Sino = (masterDatas.length + ( hydration * limit)) + 1;
                    // console.log("\n\n\n\n\n\n\n\n\n" + JSON.stringify(masterData[j]) + "\n\n\n\n\n\n\n\n\n")
                    if (masterData[j].accountID)
                        obj.AccountName = masterData[j].accountID.accountName;
                    else
                        obj.AccountName = '';
                    if (masterData[j].venue) {
                        obj.Venuename = masterData[j].venue.venueName;
                    }
                    obj.Date = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                    obj.timezone = timezone;
                    obj.TokenNumber = masterData[j].parkingID;
                    obj.plateNumber = masterData[j].plateNumber;
                    obj.brand = masterData[j].brand;
                    obj.modelName = masterData[j].modelName;
                    obj.color = masterData[j].color;
                    obj.remarks = masterData[j].remarks;
                    obj.customerType = masterData[j].customerType;
                    obj.description = masterData[j].description;
                    
                    obj.emirates =  masterData[j].emirates;

                    if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                        obj.plateSnap = 'noImage';
                    else
                        obj.plateSnap = masterData[j].snap;


                    obj.scratchesSnap = _.map(masterData[j].scratchesSnap,(p)=>{
                        p = ( "\nhttps://evaletz.com:2018/images/" + p);
                        return p;
                    }).toString();

                    if(masterData[j].documents && masterData[j].documents.length > 0){
                        obj.documents = _.map(masterData[j].documents ,(p)=>{
                            p = ( "\nhttps://evaletz.com:2018/images/" + p);
                            return p;
                        }).toString();
                    }

                    if(masterData[j].validatedBy){
                        if(masterData[j].validatedBy.userName)
                         masterData[j].validatedBy.userName = (masterData[j].validatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.userName.toString().substring(1));
                        // masterData[j].validatedBy.role = (masterData[j].validatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.role.toString().substring(1));
                        // if(masterData[j].validatedBy.validationType)
                        //     masterData[j].validatedBy.validationType = (masterData[j].validatedBy.validationType.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.validationType.toString().substring(1));
                        // if(masterData[j].validatedBy.outletName)
                        //     masterData[j].validatedBy.outletName = (masterData[j].validatedBy.outletName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.outletName.toString().substring(1));
                        // else 
                        //     masterData[j].validatedBy.outletName = '-';

                        obj.validatedBy = masterData[j].validatedBy.userName;
                        // obj.validatedBy = "Validated By :" + masterData[j].validatedBy.userName  + "(" + masterData[j].validatedBy.email + ") \nRole : " +  masterData[j].validatedBy.role  + " ("+ masterData[j].validatedBy.validationType +") \nOutlet : " + masterData[j].validatedBy.outletName + " @ " +  moment.utc(obj.validatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }

                    if(masterData[j].cashAcceptedBy){
                        if(masterData[j].cashAcceptedBy.userName)
                        masterData[j].cashAcceptedBy.userName = (masterData[j].cashAcceptedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.userName.toString().substring(1));
                        // masterData[j].cashAcceptedBy.role = (masterData[j].cashAcceptedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.role.toString().substring(1));

                        // if(!masterData[j].cashAcceptedBy.validationType)
                        //     masterData[j].cashAcceptedBy.validationType = "-";

                        // obj.cashierName = masterData[j].cashAcceptedBy.userName;
                        obj.cashAcceptedBy = masterData[j].cashAcceptedBy.userName || '';
                        // obj.cashAcceptedBy = "Cash collected By :" + masterData[j].cashAcceptedBy.userName  + "(" + masterData[j].cashAcceptedBy.email + ") \nRole : " +  masterData[j].cashAcceptedBy.role  + " ("+ masterData[j].cashAcceptedBy.validationType +") \n @ " +  moment.utc(obj.cashAcceptedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   
                    
                    
                    if(masterData[j].revalidatedBy){
                        if(masterData[j].revalidatedBy.userName)
                        masterData[j].revalidatedBy.userName = (masterData[j].revalidatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.userName.toString().substring(1));
                        // masterData[j].revalidatedBy.role = (masterData[j].revalidatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.role.toString().substring(1));

                        // if(!masterData[j].revalidatedBy.validationType)
                        //     masterData[j].revalidatedBy.validationType = "-";
                        obj.revalidatedBy =  masterData[j].revalidatedBy.userName || '';
                        // obj.revalidatedBy = "Cash recollected By :" + masterData[j].revalidatedBy.userName  + "(" + masterData[j].revalidatedBy.email + ") \nRole : " +  masterData[j].revalidatedBy.role  + " ("+ masterData[j].revalidatedBy.validationType +") \n @ " +  moment.utc(obj.revalidatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   

                    if(masterData[j].feeSplitUp)
                        masterData[j].feeSplitUp.paymentType ? obj.paymentType = masterData[j].feeSplitUp.paymentType : null;

                    getData(0);

                    function getData(l) {
                        if (l < masterData[j].log.length) {
                            if (masterData[j].log[l].activity == 'parked') {
                                obj.ParkedAtDateTime = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                                obj.ParkedBy = masterData[j].log[l].employeeName;

                                obj.ParkedAtDate = moment.utc(masterData[j].createdAt).tz(timezone).format("DD/MM/YYYY");
                                obj.ParkedAtTime = moment.utc(masterData[j].createdAt).tz(timezone).format("HH:mm");

                            }
                            if (masterData[j].log[l].activity == 'requested') {
                                obj.RequestedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.RequestedBy = masterData[j].log[l].by;

                                obj.RequestedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.RequestedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");

                                if(masterData[j].log[l].specialRequest){
                                    obj.MoreDetails = "Required At : " + moment.utc(masterData[j].log[l].specialRequest.dateTime).tz(timezone).format(momentDateformat) + "\nConfirmed By : " + (masterData[j].log[l].specialRequest.accepted ? obj.ConfirmedBy = (masterData[j].log[l].specialRequest.by.employeeName.toString().substring(0, 1).toUpperCase() + masterData[j].log[l].specialRequest.by.employeeName.toString().substring(1)) : 'Yet to confirm') + "\nConfirmed At : " + (masterData[j].log[l].specialRequest.accepted ? moment.utc(masterData[j].log[l].specialRequest.by.at).tz(timezone).format(momentDateformat) : 'Yet to confirm') + " \n\n";
                                }
                            }
                            if (masterData[j].log[l].activity == 'accept') {
                                obj.AcceptedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.AcceptedBy = masterData[j].log[l].employeeName;

                                obj.AcceptedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.AcceptedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");
                            }

                            if (masterData[j].log[l].activity == 'ready') {
                                obj.ReadyAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.ReadydBy = masterData[j].log[l].employeeName;

                                obj.ReadyAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.ReadyAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");
                            }


                            if (masterData[j].log[l].activity == 'completed') {
                                obj.CompletedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.CompletedBy = masterData[j].log[l].employeeName;

                                obj.CompletedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.CompletedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");


                                /////
                                var startTime = moment.utc(masterData[j].createdAt).tz(timezone);
                                var endTime = moment.utc(masterData[j].log[l].at).tz(timezone);
                                var duration = moment.duration(endTime.diff(startTime));
                                var hours = parseInt(duration.asHours());
                                var minutes = parseInt(duration.asMinutes())-hours*60;
                                obj.diff = hours + ' hours and '+ minutes+' minutes.';

                                if(masterData[j].log[l].cashierName)
                                    obj.cashierName = masterData[j].log[l].cashierName

                                if(masterData[j].log[l].fees)
                                    obj.fees = masterData[j].log[l].fees

                                ////
                            }
                            // if (masterData[j].log[l].activity == 'ready') {
                                // obj.ReadyAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                // obj.ReadyBy = masterData[j].log[l].employeeName;
                            // }
                            if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                                if (masterData[j].log[l].proofs.length > 0) {
                                    obj.cardMissed = 'yes';
                                    obj.name = masterData[j].log[l].missedUserName;
                                    obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                    obj.proofs = _.map(masterData[j].log[l].proofs,(p)=>{
                                        p = ( "\nhttps://evaletz.com:2018/images/" + p)
                                        return p;
                                    }).toString();
                                }
                            }
                            l++;
                            getData(l);
                        } else {
                            if (!masterData[j].changeLog)
                                masterData[j].changeLog = [];
                            var changeLogs = []
                            getChangeLogData(0);

                            function getChangeLogData(cl) {
                                if (cl < masterData[j].changeLog.length) {
                                    if (masterData[j].changeLog[cl]) {
                                        changeLogs = _.union(changeLogs, masterData[j].changeLog[cl].log);
                                        setTimeout(() => { //
                                            cl++;
                                            getChangeLogData(cl);
                                        },1); //
                                    } else {
                                        setTimeout(() => { //
                                            cl++;
                                            getChangeLogData(cl);
                                        },1); //
                                    }
                                } else {
                                    changeLogs = _.sortBy(changeLogs, function(obj) {
                                        return obj.at;
                                    });
                                    makinglogColumn(0);

                                    function makinglogColumn(col) {
                                        if (col < changeLogs.length) {
                                            if (changeLogs[col].activity && changeLogs[col].loginUser) {
                                                if (changeLogs[col].activity != "parkingID")
                                                    changeLogs[col].activity = changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1);
                                                else
                                                    changeLogs[col].activity = 'Ticket Number';
                                                changeLogs[col].at = moment.utc(changeLogs[col].at).tz(timezone).format(momentDateformat);

                                                if(changeLogs[col].loginUser.userName)
                                                    changeLogs[col].loginUser.userName  = changeLogs[col].loginUser.userName.toString();
                                                else {
                                                    changeLogs[col].loginUser.userName = '';
                                                }

                                                if (obj.changeLogs) {
                                                    obj.changeLogs += "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + " (" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                } else {
                                                    obj.changeLogs = "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + "(" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                }
                                            }
                                            col++;
                                            makinglogColumn(col);
                                        } else {
                                            masterDatas.push(obj);
                                            j++;
                                            masterAllReport(j);
                                        }
                                    }
                                }
                            }
                        }
                    }
            } else {
                done(masterDatas);
            }
        }
    },
    /**
     * 
     * 
     *    Dynamic Excel Creation Based on Hourly
     * 
     * 
     */
    exportXLSforHourlyBasedReport: function(masterDatas, venueIDs, fromDate, fromTime, toTime, status, excellData, hydration, limit, largeText ,done) {
        var originalFormatedData = [
            {
                'name': 'TokenNumber',
                'displayName': 'Ticket No',
                'selected': true
            },
            {
                'name': 'plateNumber',
                'displayName': 'Plate Number',
                'selected': true
            },
            {
                'name': 'brand',
                'displayName': 'Brand',
                'selected': true
            },
            {
                'name': 'color',
                'displayName': 'Color',
                'selected': true
            },
            {
                'name': 'ParkedBy',
                'displayName': 'CVA - In',
                'selected': true
            },
            {
                'name': 'ParkedAtDate',
                'displayName': 'Check In Date',
                'selected': true
            },
            {
                'name': 'ParkedAtTime',
                'displayName': 'Check In Time',
                'selected': true
            },
            {
                'name': 'fees',
                'displayName': 'Fees',
                'selected': true
            },
            {
                'name': 'diff',
                'displayName': 'Duration',
                'selected': true
            }
        ];

        if(status == 'complete'){
            originalFormatedData.splice(originalFormatedData.length-2, 0, {
                'name': 'CompletedBy',
                'displayName': 'CVA - Out',
                'selected': true
            });
            originalFormatedData.splice(originalFormatedData.length-2, 0, {
                'name': 'CompletedAtDate',
                'displayName': 'Check Out Date',
                'selected': true
            });
            originalFormatedData.splice(originalFormatedData.length-2, 0, {
                'name': 'CompletedAtTime',
                'displayName': 'Check Out Time',
                'selected': true
            });
        }

        
        var excellFormatedData = _.filter(originalFormatedData, (c)=> {
            return (c.selected == true);
        });

        if (masterDatas.length > 0) {
            if(hydration  == 0){
                writeHeaderforExcel((data) => {
                    toWriteRowinExcell(0);
                });
            } else 
                toWriteRowinExcell(0);

            function writeHeaderforExcel(callbackFunction1){
                gettingExcellCellByCell(0);

                function gettingExcellCellByCell(cell){
                    if(cell < excellFormatedData.length){
                        if(excellFormatedData[cell].name == "all"){
                            cell++;
                            gettingExcellCellByCell(cell);
                        } else {
                            excellData.cell(6, (cell + 1)).string(excellFormatedData[cell].displayName).style({ font: { bold: true } });
                            cell++;
                            gettingExcellCellByCell(cell);
                        }
                    }
                    else 
                        callbackFunction1('success');
                }
            }

            function toWriteRowinExcell(x) {
                if (x < masterDatas.length) {
                    ////////////////////// Static ////////////////////
                    excellData.cell(2, 2).string(masterDatas[x].AccountName.toUpperCase()).style(largeText);
                    
                    if(fromDate == ''){
                        excellData.cell(4, 2, 4, 3, true).string('Report : ' + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY") + " " + fromTime +"  To :  " + moment.utc().tz(masterDatas[x].timezone).subtract(1, 'days').format("DD-MM-YYYY") + " " + toTime).style({
                            font: {
                                bold: true
                            }
                        });
                    } else 
                    excellData.cell(4, 2, 4, 3, true).string('Report ' + moment(fromDate).format("DD-MM-YYYY") + " From " + fromTime + "  To  " + toTime).style({ font: { bold: true } });

                    if (venueIDs == 'All' || venueIDs == '' || venueIDs == null)
                        excellData.cell(4, 4, 4, 5, true).string('Venue : All').style({ font: { bold: true } });
                    else 
                        excellData.cell(4, 4, 4, 5, true).string('Venue :' +  masterDatas[x].Venuename).style({ font: { bold: true } });
                    ////////////////////// Static ////////////////////
                    
                    writeContentforExcel();

                    function writeContentforExcel(){
                        gettingExcellCellByCell1(0);

                        function gettingExcellCellByCell1(cell){
                            if(cell < excellFormatedData.length){                                            
                                if(excellFormatedData[cell].name == 'all'){
                                    setTimeout(() => { //
                                        cell++;
                                        gettingExcellCellByCell1(cell);
                                    },1);//
                                } else {

                                if(excellFormatedData[cell].name == 'Sino')
                                excellData.cell(( (x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].Sino)
                            
                                if(excellFormatedData[cell].name == 'Venuename'){
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].Venuename)
                                    // console.log(masterDatas[x].Venuename  + "----------------");
                                }

                                if(excellFormatedData[cell].name == 'Date')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].Date));

                                if(excellFormatedData[cell].name == 'TokenNumber')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].TokenNumber)

                                if(excellFormatedData[cell].name == 'plateNumber')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].plateNumber.toUpperCase())
                                
                                if (excellFormatedData[cell].name == 'plateSnap' && masterDatas[x].plateSnap != 'noImage') {
                                    var _temp = "https://evaletz.com:2018/images/" + masterDatas[x].plateSnap;
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).link(_temp);
                                }

                                if (masterDatas[x].brand != undefined && excellFormatedData[cell].name == 'brand')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].brand)
                                if (masterDatas[x].modelName != undefined && excellFormatedData[cell].name == 'modelName')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].modelName)
                                if (masterDatas[x].color != undefined && excellFormatedData[cell].name == 'color')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].color)


                                if (masterDatas[x].customerType != undefined && excellFormatedData[cell].name == 'customerType')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].customerType)
                                if (masterDatas[x].remarks != undefined && excellFormatedData[cell].name == 'remarks')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string(masterDatas[x].remarks)
                                /////////////
                                if (masterDatas[x].ParkedAtDateTime != undefined && excellFormatedData[cell].name == 'ParkedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDateTime))
                                if (masterDatas[x].ParkedAtDate != undefined && excellFormatedData[cell].name == 'ParkedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtDate))
                                if (masterDatas[x].ParkedAtTime != undefined && excellFormatedData[cell].name == 'ParkedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].ParkedAtTime))
                                if (masterDatas[x].ParkedBy != undefined && excellFormatedData[cell].name == 'ParkedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].ParkedBy)
                                /////////////////
                                if (masterDatas[x].RequestedAtDateTime != undefined && excellFormatedData[cell].name == 'RequestedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDateTime))
                                if (masterDatas[x].RequestedAtDate != undefined && excellFormatedData[cell].name == 'RequestedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtDate))
                                if (masterDatas[x].RequestedAtTime != undefined && excellFormatedData[cell].name == 'RequestedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedAtTime))
                                if (masterDatas[x].RequestedBy != undefined && excellFormatedData[cell].name == 'RequestedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + (masterDatas[x].RequestedBy != "000000000" ? masterDatas[x].RequestedBy : 'Guest'));
                                ////////////
                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'RequestedLater')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("Yes") // requested car later 
                                if (masterDatas[x].MoreDetails != undefined && excellFormatedData[cell].name == 'MoreDetails')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].MoreDetails)
                                //////////////
                                if (masterDatas[x].AcceptedAtDateTime != undefined && excellFormatedData[cell].name == 'AcceptedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDateTime)
                                if (masterDatas[x].AcceptedAtDate != undefined && excellFormatedData[cell].name == 'AcceptedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtDate)
                                if (masterDatas[x].AcceptedAtTime != undefined && excellFormatedData[cell].name == 'AcceptedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedAtTime)
                                if (masterDatas[x].AcceptedBy != undefined && excellFormatedData[cell].name == 'AcceptedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].AcceptedBy)
                                /////////////////
                                if (masterDatas[x].CompletedAtDateTime != undefined && excellFormatedData[cell].name == 'CompletedAtDateTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDateTime)
                                if (masterDatas[x].CompletedAtDate != undefined && excellFormatedData[cell].name == 'CompletedAtDate')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtDate)
                                if (masterDatas[x].CompletedAtTime != undefined && excellFormatedData[cell].name == 'CompletedAtTime')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedAtTime)
                                if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'CompletedBy')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].CompletedBy)
                                ////////////////
                                if (masterDatas[x].cardMissed == 'yes' ) {
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'cardMissed')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cardMissed)
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'name')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].name)
                                    if (masterDatas[x].CompletedBy != undefined && excellFormatedData[cell].name == 'mobileNumber')
                                        excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].mobileNumber)
                                }
                                if (masterDatas[x].changeLogs != undefined && excellFormatedData[cell].name == 'changeLogs')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].changeLogs)
                                ////////////
                                if (masterDatas[x].cashierName != undefined && excellFormatedData[cell].name == 'cashierName')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cashierName)
                                if (masterDatas[x].fees != undefined && excellFormatedData[cell].name == 'fees')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).number(parseInt(masterDatas[x].fees))
                                    
                                if (masterDatas[x].description != undefined && excellFormatedData[cell].name == 'description')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].description)
                                //////////////////
                                if (masterDatas[x].diff != undefined && excellFormatedData[cell].name == 'diff')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].diff)
                                /////////////////
                                if (masterDatas[x].proofs != undefined && excellFormatedData[cell].name == 'proofs')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].proofs)
                                if (masterDatas[x].documents != undefined && excellFormatedData[cell].name == 'documents')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].documents)
                                if (masterDatas[x].scratchesSnap != undefined && excellFormatedData[cell].name == 'scratchesSnap')
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].scratchesSnap)
                                ///////////////////////

                                //// Validation 
                                if(excellFormatedData[cell].name == 'validatedBy' && masterDatas[x].validatedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].validatedBy);
                                /// cash collcected info
                                if(excellFormatedData[cell].name == 'cashAcceptedBy' && masterDatas[x].cashAcceptedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].cashAcceptedBy);
                                ///////////////////

                                //// Revalidation 
                                if(excellFormatedData[cell].name == 'revalidatedBy' && masterDatas[x].revalidatedBy)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].revalidatedBy);
                                ///////////////////

                                if(excellFormatedData[cell].name == 'paymentType' && masterDatas[x].paymentType)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].paymentType);

                                if(excellFormatedData[cell].name == 'emirates' && masterDatas[x].emirates)
                                    excellData.cell(((x  + (hydration * limit)) + 7), (cell+1)).string("" + masterDatas[x].emirates);


                                    setTimeout(() => { //
                                        cell++;
                                        gettingExcellCellByCell1(cell);
                                    },1);//
                                }
                            }
                            else {
                                // setTimeout(() => {
                                    x++
                                    toWriteRowinExcell(x);
                                // },1);
                            }
                        }
                    }
                } else {
                    // wb.write("assets/images/" + newDate + ".xlsx", function(err, stats) {
                    //     console.log('Excel.xlsx written and has the following stats');
                        done(excellData);
                    // });
                }
            }
        } else {
            // res.send("no.xlsx");
            done("no.xlsx");
        }
    },
    convertDataforExcellFormatforHourlyBasedReport : function(masterData, fromDate, fromTime, toTime, status, hydration, limit,  done) {
        var obj = {};
        var masterDatas = [];
        masterAllReport(0);

        function masterAllReport(j) {
            if (j < masterData.length) {
                    obj = {};
                    if(masterData[j].accountID && masterData[j].accountID.timeZone)
                        timezone = masterData[j].accountID.timeZone;
                    else 
                        timezone = "Asia/Kolkata";
                    obj.Sino = (masterDatas.length + ( hydration * limit)) + 1;
                    // console.log("\n\n\n\n\n\n\n\n\n" + JSON.stringify(masterData[j]) + "\n\n\n\n\n\n\n\n\n")
                    if (masterData[j].accountID)
                        obj.AccountName = masterData[j].accountID.accountName;
                    else
                        obj.AccountName = '';
                    if (masterData[j].venue) {
                        obj.Venuename = masterData[j].venue.venueName;
                    }
                    obj.Date = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                    obj.timezone = timezone;
                    obj.TokenNumber = masterData[j].parkingID;
                    obj.plateNumber = masterData[j].plateNumber;
                    obj.brand = masterData[j].brand;
                    obj.modelName = masterData[j].modelName;
                    obj.color = masterData[j].color;
                    obj.remarks = masterData[j].remarks;
                    obj.customerType = masterData[j].customerType;
                    obj.description = masterData[j].description;
                    
                    obj.emirates =  masterData[j].emirates;

                    if (masterData[j].snap == null || masterData[j].snap == undefined || masterData[j].snap == '' || masterData[j].snap == 'undefined')
                        obj.plateSnap = 'noImage';
                    else
                        obj.plateSnap = masterData[j].snap;


                    obj.scratchesSnap = _.map(masterData[j].scratchesSnap,(p)=>{
                        p = ( "\nhttps://evaletz.com:2018/images/" + p);
                        return p;
                    }).toString();

                    if(masterData[j].documents && masterData[j].documents.length > 0){
                        obj.documents = _.map(masterData[j].documents ,(p)=>{
                            p = ( "\nhttps://evaletz.com:2018/images/" + p);
                            return p;
                        }).toString();
                    }

                    if(masterData[j].validatedBy){
                        if(masterData[j].validatedBy.userName)
                         masterData[j].validatedBy.userName = (masterData[j].validatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.userName.toString().substring(1));
                        // masterData[j].validatedBy.role = (masterData[j].validatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.role.toString().substring(1));
                        // if(masterData[j].validatedBy.validationType)
                        //     masterData[j].validatedBy.validationType = (masterData[j].validatedBy.validationType.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.validationType.toString().substring(1));
                        // if(masterData[j].validatedBy.outletName)
                        //     masterData[j].validatedBy.outletName = (masterData[j].validatedBy.outletName.toString().substring(0, 1).toUpperCase() + masterData[j].validatedBy.outletName.toString().substring(1));
                        // else 
                        //     masterData[j].validatedBy.outletName = '-';

                        obj.validatedBy = masterData[j].validatedBy.userName;
                        // obj.validatedBy = "Validated By :" + masterData[j].validatedBy.userName  + "(" + masterData[j].validatedBy.email + ") \nRole : " +  masterData[j].validatedBy.role  + " ("+ masterData[j].validatedBy.validationType +") \nOutlet : " + masterData[j].validatedBy.outletName + " @ " +  moment.utc(obj.validatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }

                    if(masterData[j].cashAcceptedBy){
                        if(masterData[j].cashAcceptedBy.userName)
                        masterData[j].cashAcceptedBy.userName = (masterData[j].cashAcceptedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.userName.toString().substring(1));
                        // masterData[j].cashAcceptedBy.role = (masterData[j].cashAcceptedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].cashAcceptedBy.role.toString().substring(1));

                        // if(!masterData[j].cashAcceptedBy.validationType)
                        //     masterData[j].cashAcceptedBy.validationType = "-";

                        // obj.cashierName = masterData[j].cashAcceptedBy.userName;
                        obj.cashAcceptedBy = masterData[j].cashAcceptedBy.userName || '';
                        // obj.cashAcceptedBy = "Cash collected By :" + masterData[j].cashAcceptedBy.userName  + "(" + masterData[j].cashAcceptedBy.email + ") \nRole : " +  masterData[j].cashAcceptedBy.role  + " ("+ masterData[j].cashAcceptedBy.validationType +") \n @ " +  moment.utc(obj.cashAcceptedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   
                    
                    
                    if(masterData[j].revalidatedBy){
                        if(masterData[j].revalidatedBy.userName)
                        masterData[j].revalidatedBy.userName = (masterData[j].revalidatedBy.userName.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.userName.toString().substring(1));
                        // masterData[j].revalidatedBy.role = (masterData[j].revalidatedBy.role.toString().substring(0, 1).toUpperCase() + masterData[j].revalidatedBy.role.toString().substring(1));

                        // if(!masterData[j].revalidatedBy.validationType)
                        //     masterData[j].revalidatedBy.validationType = "-";
                        obj.revalidatedBy =  masterData[j].revalidatedBy.userName || '';
                        // obj.revalidatedBy = "Cash recollected By :" + masterData[j].revalidatedBy.userName  + "(" + masterData[j].revalidatedBy.email + ") \nRole : " +  masterData[j].revalidatedBy.role  + " ("+ masterData[j].revalidatedBy.validationType +") \n @ " +  moment.utc(obj.revalidatedAt).tz(timezone).format(momentDateformat); + " \n\n";
                    }   

                    if(masterData[j].feeSplitUp)
                        masterData[j].feeSplitUp.paymentType ? obj.paymentType = masterData[j].feeSplitUp.paymentType : null;

                    getData(0);

                    function getData(l) {
                        if (l < masterData[j].log.length) {
                            if (masterData[j].log[l].activity == 'parked') {
                                obj.ParkedAtDateTime = moment.utc(masterData[j].createdAt).tz(timezone).format(momentDateformat);
                                obj.ParkedBy = masterData[j].log[l].employeeName;

                                obj.ParkedAtDate = moment.utc(masterData[j].createdAt).tz(timezone).format("DD/MM/YYYY");
                                obj.ParkedAtTime = moment.utc(masterData[j].createdAt).tz(timezone).format("HH:mm");

                            }
                            if (masterData[j].log[l].activity == 'requested') {
                                obj.RequestedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.RequestedBy = masterData[j].log[l].by;

                                obj.RequestedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.RequestedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");

                                if(masterData[j].log[l].specialRequest){
                                    obj.MoreDetails = "Required At : " + moment.utc(masterData[j].log[l].specialRequest.dateTime).tz(timezone).format(momentDateformat) + "\nConfirmed By : " + (masterData[j].log[l].specialRequest.accepted ? obj.ConfirmedBy = (masterData[j].log[l].specialRequest.by.employeeName.toString().substring(0, 1).toUpperCase() + masterData[j].log[l].specialRequest.by.employeeName.toString().substring(1)) : 'Yet to confirm') + "\nConfirmed At : " + (masterData[j].log[l].specialRequest.accepted ? moment.utc(masterData[j].log[l].specialRequest.by.at).tz(timezone).format(momentDateformat) : 'Yet to confirm') + " \n\n";
                                }
                            }
                            if (masterData[j].log[l].activity == 'accept') {
                                obj.AcceptedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.AcceptedBy = masterData[j].log[l].employeeName;

                                obj.AcceptedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.AcceptedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");
                            }
                            if (masterData[j].log[l].activity == 'completed') {
                                obj.CompletedAtDateTime = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.CompletedBy = masterData[j].log[l].employeeName;

                                obj.CompletedAtDate = moment.utc(masterData[j].log[l].at).tz(timezone).format("DD/MM/YYYY");
                                obj.CompletedAtTime = moment.utc(masterData[j].log[l].at).tz(timezone).format("HH:mm");


                                /////
                                var startTime = moment.utc(masterData[j].createdAt).tz(timezone);
                                var endTime = moment.utc(masterData[j].log[l].at).tz(timezone);
                                var duration = moment.duration(endTime.diff(startTime));
                                var hours = parseInt(duration.asHours());
                                var minutes = parseInt(duration.asMinutes())-hours*60;
                                obj.diff = hours + ' hours and '+ minutes+' minutes.';

                                if(masterData[j].log[l].cashierName)
                                    obj.cashierName = masterData[j].log[l].cashierName

                                if(masterData[j].log[l].fees)
                                    obj.fees = masterData[j].log[l].fees

                                ////
                            }
                            if (masterData[j].log[l].activity == 'ready') {
                                obj.ReadyAt = moment.utc(masterData[j].log[l].at).tz(timezone).format(momentDateformat);
                                obj.ReadyBy = masterData[j].log[l].employeeName;
                            }
                            if (masterData[j].log[l].activity == 'completed' && masterData[j].log[l].proofs) {
                                if (masterData[j].log[l].proofs.length > 0) {
                                    obj.cardMissed = 'yes';
                                    obj.name = masterData[j].log[l].missedUserName;
                                    obj.mobileNumber = masterData[j].log[l].missedUserMobile;
                                    obj.proofs = _.map(masterData[j].log[l].proofs,(p)=>{
                                        p = ( "\nhttps://evaletz.com:2018/images/" + p)
                                        return p;
                                    }).toString();
                                }
                            }
                            l++;
                            getData(l);
                        } else {
                            if (!masterData[j].changeLog)
                                masterData[j].changeLog = [];
                            var changeLogs = []
                            getChangeLogData(0);

                            function getChangeLogData(cl) {
                                if (cl < masterData[j].changeLog.length) {
                                    if (masterData[j].changeLog[cl]) {
                                        changeLogs = _.union(changeLogs, masterData[j].changeLog[cl].log);
                                        setTimeout(() => { //
                                            cl++;
                                            getChangeLogData(cl);
                                        },1); //
                                    } else {
                                        setTimeout(() => { //
                                            cl++;
                                            getChangeLogData(cl);
                                        },1); //
                                    }
                                } else {
                                    changeLogs = _.sortBy(changeLogs, function(obj) {
                                        return obj.at;
                                    });
                                    makinglogColumn(0);

                                    function makinglogColumn(col) {
                                        if (col < changeLogs.length) {
                                            if (changeLogs[col].activity && changeLogs[col].loginUser) {
                                                if (changeLogs[col].activity != "parkingID")
                                                    changeLogs[col].activity = changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(0, 1).toUpperCase() + changeLogs[col].activity.toString().replace(/([a-z])([A-Z])/g, "$1 $2").substring(1);
                                                else
                                                    changeLogs[col].activity = 'Ticket Number';
                                                changeLogs[col].at = moment.utc(changeLogs[col].at).tz(timezone).format(momentDateformat);

                                                if(changeLogs[col].loginUser.userName)
                                                    changeLogs[col].loginUser.userName  = changeLogs[col].loginUser.userName.toString();
                                                else {
                                                    changeLogs[col].loginUser.userName = '';
                                                }

                                                if (obj.changeLogs) {
                                                    obj.changeLogs += "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + " (" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                } else {
                                                    obj.changeLogs = "" + changeLogs[col].activity + " : " + changeLogs[col].changes + "\nBy :" + (changeLogs[col].loginUser.userName.toString().substring(0, 1).toUpperCase() + changeLogs[col].loginUser.userName.toString().substring(1)) + "(" + changeLogs[col].loginUser.email + ") \nAt : " + changeLogs[col].at + " \n\n";
                                                }
                                            }
                                            col++;
                                            makinglogColumn(col);
                                        } else {
                                            masterDatas.push(obj);
                                            j++;
                                            masterAllReport(j);
                                        }
                                    }
                                }
                            }
                        }
                    }
            } else {
                done(masterDatas);
            }
        }
    },
};