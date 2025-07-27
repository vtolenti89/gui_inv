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
var mainsFrequency = null;
var dutyCycle = null;

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
                    $('#readControls').removeClass('d-none');
                    $('#writeControls').removeClass('d-none');
                    $('#portSelect').prop('disabled', true);
                } else {
                    alert("Connection failed: " + data.error);
                    $('#readButton').addClass('d-none');
                }
            }
        });
    });

    $('#closedLoopCheckbox').on('change', function () {
        if (this.checked) {
            $('#targetCurrentWrapper').removeClass('d-none');
            $('#targetDutyCycleWrapper').addClass('d-none');
        } else {
            $('#targetCurrentWrapper').addClass('d-none');
            $('#targetDutyCycleWrapper').removeClass('d-none');
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

    // Stop interval when checkbox is unchecked
    $('#autoReadCheckbox').on('change', function () {
        if (!this.checked) {
            clearInterval(readInterval);
            readInterval = null;
        }
    });

    // Function to read serial data
    function readSerialData() {
        $.get("/read", function (response) {
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
        mainsFrequency = data.f_mains;
        dutyCycle = data.dc;
        updateDOM();
    }

    function updateDOM() {
        $('#inputVoltage').val(inputVoltage + ' V')
        $('#inputCurrent').val(inputCurrent + ' A')
        $('#outputVoltage').val(outputVoltage + ' V')
        $('#outputCurrent').val(outputCurrent + 'A')
        $('#inputFrequency').val(mainsFrequency + ' Hz')
        $('#dutyCycle').val(dutyCycle * 100 + ' %')

        updateGraphs();
    }

    function addToBuffer(buffer, newItem) {
        if (buffer.length >= bufferSize) {
            buffer.shift(); // Remove the oldest item (first in)
        }
        buffer.push(newItem); // Add the newest item
    }

    function createGraph(id, title, labelX = "X", labelY = "Y") {
        const canvasId = `graph-${id}`;

        // Append canvas element
        $('#graphContainer').append(`
        <div class="col-md-6">
            <canvas id="${canvasId}" height="250"></canvas>
        </div>
    `);

        // Create Chart.js instance
        const ctx = document.getElementById(canvasId).getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: `${labelY} vs ${labelX}`,
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0,123,255,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
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
    function updateGraph(id, x, y, maxPoints = 500) {
        const chart = graphRegistry[id];
        if (!chart) return;

        chart.data.labels.push(x);
        chart.data.datasets[0].data.push(y);

        // Limit to last `maxPoints` samples
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift(); // Remove oldest label
            chart.data.datasets[0].data.shift(); // Remove oldest data point
        }

        chart.update();
    }

    function updateGraphs() {
        const time = new Date().toLocaleTimeString(); // or use a counter
        console.log("Updatieng graphs with", time, inputVoltage);
        updateGraph('inputVoltageVsTime', time, inputVoltage);
        updateGraph('inputCurrentVsTime', time, inputCurrent);
        updateGraph('outputVoltageVsTime', time, outputVoltage);
        updateGraph('outputCurrentVsTime', time, outputCurrent);
        updateGraph('temperatureHB1VsTime', time, tempHB1);
        updateGraph('temperatureHB2VsTime', time, tempHB2);
        updateGraph('temperaturePCB1VsTime', time, tempPCB1);
        updateGraph('temperaturePCB21VsTime', time, tempPCB2);


    }

    function createGraphs() {
        createGraph("inputVoltageVsTime", "Input Voltage", "Time [s]", "Voltage (V)");
        createGraph("inputCurrentVsTime", "Input Current", "Time [s]", "Current (V)");
        createGraph("outputVoltageVsTime", "Output Voltage", "Time [s]", "Voltage (V)");
        createGraph("outputCurrentVsTime", "Output Current", "Time [s]", "Current (V)");
        createGraph("temperatureHB1VsTime", "Temperature H Bridge 1", "Time [s]", "Temperature (°C)");
        createGraph("temperatureHB2VsTime", "Temperature H Bridge 2", "Time [s]", "Temperature (°C)");
        createGraph("temperaturePCB1VsTime", "Temperature PCB 1", "Time [s]", "Temperature (°C)");
        createGraph("temperaturePCB21VsTime", "Temperature PCB 2", "Time [s]", "Temperature (°C)");

    }
});
