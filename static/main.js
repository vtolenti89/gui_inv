var readInterval = null;
var bufferSize = 100;
var inputVoltage;
var inputCurrent;
var outputVoltage;
var outputCurrent;
var tempHB1;
var tempHB2;
var tempPCB1;
var tempPCB2;
var tempHeatsink;
var tempTrafo;
var mainsFrequency = null;
var dutyCycle = null;

var mainsFrequency = null;
var mainsUndervoltage = null;
var busOvervoltage = null;
var overcurrent1 = null;
var overcurrent2 = null;
var hb1Fault = null;
var hb2Fault = null;
var hb1OVT = null;
var hb2OVT = null;
var commFault = null;
var doorSwitch = null;
var cutout = null;
var contactor1 = null; 
var contactor2 = null;
var hb1Ready = null;
var hb2Ready = null;
var hbSafeEnable = null;

const graphRegistry = {};

$(document).ready(function () {

    createGraphs();
    // var isConencted = false;
    // Populate COM ports on page load
    $.get("/ports", function (ports) {
        $.each(ports, function (i, port) {
            $('#portSelect').append(
                $('<option></option>').val(port).text(port)
            );
        });
    });

    // Connect to selected port
    $('#connectBtn').on('click', function () {
        const selectedPort = $('#portSelect').val();


        $.get("/set_current", function (response) {
            const output = $('#output');
            if (response.success) {
                try {
                    const json = JSON.parse(response.data);
                    output.text(JSON.stringify(json, null, 2));
                    updateMeasurement(json)
                } catch {
                    output.text("Invalid JSON received:\n" + response.data);
                }
            } else {
                output.text("Error: " + response.error);
            }
        });


        $.ajax({
            url: '/connect',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ port: selectedPort }),
            success: function (data) {
                if (data.success) {
                    //alert("Connected!");
                    // isConencted = true
                    // $('#readControls').removeClass('d-none');
                    // $('#currentControl').removeClass('d-none');
                    $('#readControls').prop('disabled', false);
                    $('#currentControl').prop('disabled', false)
                    $('#portSelect').prop('disabled', true);
                } else {
                    alert("Connection failed: " + data.error);
                    $('#readButton').prop('disabled', true);
                }
            }
        });
    });

    $('#closedLoopCheckbox').on('change', function () {
        if (this.checked) {
            $('#targetCurrentWrapper').prop('disabled', false);
            $('#targetDutyCycleWrapper').prop('disabled', true);
        } else {
            $('#targetCurrentWrapper').prop('disabled', true);
            $('#targetDutyCycleWrapper').prop('disabled', false);
        }
    })

    $('#logCheckbox').on('change', function () {
        if (this.checked) {
            $('#outputLog').removeClass('d-none')
        } else {
            $('#outputLog').addClass('d-none')

        }
    })

    // Handle read button click
    $('#readButton').on('click', function () {
        const isAuto = $('#autoReadCheckbox').is(':checked');
        const intervalMs = parseInt($('#intervalInput').val()) || 1000;

        // Always read once immediately
        readSerialData();

        if (isAuto) {
            if (!readInterval) {
                readInterval = setInterval(readSerialData, intervalMs);
            }
        } else {
            if (readInterval) {
                clearInterval(readInterval);
                readInterval = null;

            }
        }
    });

    // Handle read button click
    $('#commandButton').on('click', function () {

        // Always read once immediately
        writeSerialData();
    });

    $('#setCurrentButton').on('click', function () {
        const current = parseInt($('#targetCurrent').val());

        if (!current) {
            return;
        }

        $.ajax({
            url: '/set_current',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ current: current }),
            success: function (response) {
                if (response.success) {
                    readSerialData();
                } else {
                    alert("Current coulkd not be set.")
                    console.log("Error: " + response.error);
                }
            }
        });
    });


    $('#setDutyCycleButton').on('click', function () {
        const targetDutyCycle = parseInt($('#targetDutyCycle').val()) / 100;

        if (targetDutyCycle < 0 || targetDutyCycle > 1) {
            return;
        }

        $.ajax({
            url: '/set_duty_cycle',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ dutyCycle: targetDutyCycle }),
            success: function (response) {
                if (response.success) {
                    readSerialData();
                } else {
                    alert("Duty Cycle could not be set.")
                    console.log("Error: " + response.error);
                }
            }
        });
    });

    $('#stopButton').on('click', function () {
        $.get("/stop", function (response) {
            if (response.success) {
                try {
                    updateMeasurement(json)
                } catch (err) {
                    console.log(err)
                    output.text("CR cannot be stopped.\n");
                }
            } else {
                output.text("Error: " + response.error);
            }
        });
    });

    // Stop interval when checkbox is unchecked
    $('#autoReadCheckbox').on('change', function () {
        if (!this.checked) {
            clearInterval(readInterval);
            readInterval = null;
        }
    });

    // Function to read serial data
    function readSerialData() {
        $.get("/pool_status", function (response) {
            const output = $('#output');
            if (response.success) {
                try {
                    const json = JSON.parse(response.data);
                    output.text(JSON.stringify(json, null, 2));
                    updateMeasurement(json)
                } catch (err) {
                    console.log(err)
                    console.log(response.data);
                    output.text("Invalid JSON received:\n" + response.data);
                }
            } else {
                output.text("Error: " + response.error);
            }
        });
    }

    function writeSerialData() {
        const data = parseInt($('#commandInput').val());

        if (!data) {
            return;
        }

        $.ajax({
            url: '/write',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ data }),
            success: function (response) {
                if (response.success) {
                    readSerialData();
                } else {
                    alert("Current coulkd not be set.")
                    console.log("Error: " + response.error);
                }
            }
        });
    }



    function updateMeasurement(data) {
        // addToBuffer(inputVoltage, data.vin_rms);
        // addToBuffer(inputCurrent, data.iin_rms);
        // addToBuffer(outputVoltage, data.vout_rms);
        // addToBuffer(outputCurrent, data.iout_rms);
        // addToBuffer(tempHB1, data.t_hb1);
        // addToBuffer(tempHB2, data.t_hb2);
        // addToBuffer(tempPCB1, data.t_pcb1);
        // addToBuffer(tempHB2, data.t_pcb2);
        inputVoltage = data.vin_rms;
        inputCurrent = data.iin_rms;
        outputVoltage = data.vout_rms;
        outputCurrent = data.iout_rms;
        tempHB1 = data.t_hb1;
        tempHB2 = data.t_hb2;
        tempPCB1 = data.t_pcb1;
        tempHB2 = data.t_pcb2;
        tempHeatsink = data.t_hs;
        tempTrafo = data.t_tf;
        mainsFrequency = data.f_mains;
        dutyCycle = data.dc;
        mainsUndervoltage = data.mains_udv;
        busOvervoltage = data.bus_ovv;
        overcurrent1 = data.ovc1;
        overcurrent2 = data.ovc2;
        hb1Fault = data.hb1_fault;
        hb2Fault = data.hb2_fault;
        hb1OVT = data.hb1_ovt;
        hb2OVT = data.hb2_ovt;
        commFault = data.com_fault;
        doorSwitch = data.door_sw;
        cutout = data.cutout;
        contactor1 = data.cont1;
        contactor2 = data.cont2;
        hb1Ready = data.hb1_rdy;
        hb2Ready = data.hb2_rdy;
        hbSafeEnable = data.hb_sf_en;

        updateDOM();
    }

    function updateDOM() {
        $('#inputVoltage').val(inputVoltage + ' V')
        $('#inputCurrent').val(inputCurrent + ' A')
        $('#outputVoltage').val(outputVoltage + ' V')
        $('#outputCurrent').val(outputCurrent + 'A')
        $('#inputFrequency').val(mainsFrequency + ' Hz')
        $('#dutyCycle').val(dutyCycle * 100 + ' %')
        
        updateStatus();
        updateGraphs();
    }

    function updateStatus() {
        updateStatusBadge('door_sw', doorSwitch);
        updateStatusBadge('cutout', cutout);
        updateStatusBadge("cont1", contactor1);
        updateStatusBadge("cont2", contactor2);
        updateStatusBadge("hb1_rdy", hb1Ready);
        updateStatusBadge("hb2_rdy", hb2Ready);
        updateStatusBadge("hb_sf_en", hbSafeEnable);
        updateFaultBadge("mains_udv", mainsUndervoltage);
        updateFaultBadge("bus_ovv", busOvervoltage);
        updateFaultBadge("ovc1", overcurrent1);
        updateFaultBadge("ovc2", overcurrent2);
        updateFaultBadge("hb1_flt", hb1Fault);
        updateFaultBadge("hb2_flt", hb2Fault);
        updateFaultBadge("hb1_ovt", hb1OVT);
        updateFaultBadge("hb2_ovt", hb2OVT);
        updateFaultBadge("comm_flt", commFault);
    }

    function updateStatusBadge(id, status) {
        if(status) {
            $("#" + id).addClass("bg-success");
            $("#" + id).removeClass("bg-light text-dark");
        } else {
            $("#" + id).removeClass("bg-success");
            $("#" + id).addClass("bg-light text-dark");
        }

    }

    function updateFaultBadge(id, status) {
        if(status) {
            $("#" + id).addClass("bg-danger");
            $("#" + id).removeClass("bg-light text-dark");
        } else {
            $("#" + id).removeClass("bg-danger");
            $("#" + id).addClass("bg-light text-dark");
        }

    }

    function addToBuffer(buffer, newItem) {
        if (buffer.length >= bufferSize) {
            buffer.shift(); // Remove the oldest item (first in)
        }
        buffer.push(newItem); // Add the newest item
    }



    function createGraph(id, title, labelX = "X", labelY = "Y", datasets = [], options = { widthMCol: 6 }) {
        const canvasId = `graph-${id}`;

        // Append canvas element
        $('#graphContainer').append(`
        <div class="col-md-${options.widthMCol}">
            <canvas id="${canvasId}" height="250"></canvas>
        </div>
    `);
        // Build datasets dynamically
        const chartDatasets = datasets.map((dataset, index) => ({
            label: dataset.label || `Curve ${index + 1}`,
            data: [],
            borderColor: dataset.borderColor || `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
            backgroundColor: dataset.backgroundColor || 'rgba(0,123,255,0.1)',
            fill: dataset.fill || true,
            tension: dataset.tension || 0.4,
            pointRadius: dataset.pointRadius || 3
        }));

        // Create Chart.js instance
        const ctx = document.getElementById(canvasId).getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: chartDatasets // Use dynamically created datasets
            },
            options: {
                responsive: true,
                animation: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${title}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true, // Show the legend
                        labels: {
                            font: {
                                size: 12
                            }
                        },
                        onClick: (e, legendItem) => {
                            // Toggle visibility of datasets
                            const datasetIndex = legendItem.datasetIndex;
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.hidden = !meta.hidden; // Toggle visibility
                            chart.update();
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: labelX }
                    },
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: labelY },
                        ticks: {
                            autoSkip: true
                        }
                    }
                }
            }
        });

        graphRegistry[id] = chart;
    }

    // Update existing graph with new point
    function updateGraph(id, x, yValues, maxPoints = 500) {
        const chart = graphRegistry[id];
        if (!chart) return;

        // Add new label (X value)
        chart.data.labels.push(x);

        // Add new data points (Y values) to corresponding datasets
        chart.data.datasets.forEach((dataset, index) => {
            const yValue = yValues[index]; // Y value for this dataset
            dataset.data.push(yValue);
        });

        // Limit to last `maxPoints` samples for all datasets
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift(); // Remove oldest label
            chart.data.datasets.forEach((dataset) => dataset.data.shift()); // Remove oldest data point
        }

        chart.update();
    }

    function updateGraphs() {
        const time = new Date().toLocaleTimeString(); // or use a counter
        console.log("Updatieng graphs with", time, [inputVoltage]);
        updateGraph('inputVoltageVsTime', time, [inputVoltage]);
        updateGraph('inputCurrentVsTime', time, [inputCurrent]);
        updateGraph('outputVoltageVsTime', time, [outputVoltage]);
        updateGraph('outputCurrentVsTime', time, [outputCurrent]);
        updateGraph('temperatureVsTime', time, [tempHB1, tempHB2, tempPCB1, tempPCB2, tempHeatsink, tempTrafo]);


    }

    function createGraphs() {
        createGraph("inputVoltageVsTime", "Input Voltage", "Time [s]", "Voltage (V)",
            [
                { label: 'Input Voltage', borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)', }
            ],
        );
        createGraph("inputCurrentVsTime", "Input Current", "Time [s]", "Current (V)",
            [
                { label: 'Input Current', borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)' }
            ]
        );
        createGraph("outputVoltageVsTime", "Output Voltage", "Time [s]", "Voltage (V)",
            [
                { label: 'Output Voltage', borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)' }
            ]
        );
        createGraph("outputCurrentVsTime", "Output Current", "Time [s]", "Current (V)",
            [
                { label: 'Output Current', borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)' }
            ]
        );
        createGraph("temperatureVsTime", "Temperature H Bridge 1", "Time [s]", "Temperature (°C)",
            [{ label: 'HB/SiC 1', borderColor: 'blue', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            { label: 'HB/SiC 2', borderColor: 'red', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            { label: 'PCB 1', borderColor: 'green', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            { label: 'PCB 2', borderColor: 'yellow', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            { label: 'Heatsink', borderColor: 'orange', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            { label: 'Transformer', borderColor: 'purple', backgroundColor: 'rgba(0, 0, 255, 0.1)' },
            ],
            {
                widthMCol: 12
            }
        );

    }
});
