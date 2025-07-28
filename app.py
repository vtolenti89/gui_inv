from flask import Flask, render_template, request, jsonify
import serial
import serial.tools.list_ports
import threading
import time

app = Flask(__name__)

serial_connection = None
lock = threading.Lock()

def list_serial_ports():
    return [port.device for port in serial.tools.list_ports.comports()]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ports')
def get_ports():
    ports = list_serial_ports()
    print("ports", ports)
    return jsonify(ports)

@app.route('/connect', methods=['POST'])
def connect():
    global serial_connection
    port = request.json.get('port')
    try:
        with lock:
            serial_connection = serial.Serial(port, 9600, timeout=2)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/read', methods=['GET'])
def read_data():
    global serial_connection
    if serial_connection and serial_connection.is_open:
        try:
            with lock:
                data = serial_connection.readline().decode('utf-8').strip()
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected"})

@app.route('/stop', methods=['GET'])
def stop():
    global serial_connection
    if serial_connection and serial_connection.is_open:
        try:
            with lock:
                serial_connection.write(b'stop\n')
                data = serial_connection.readline().decode('utf-8').strip()
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected"})


@app.route('/pool_status', methods=['GET'])
def pool_status():
    global serial_connection
    if serial_connection and serial_connection.is_open:
        try:
            with lock:
                serial_connection.write(b'poolStatus\n')
                time.sleep(1)
                data = serial_connection.readline().decode('utf-8').strip()
            return jsonify({"success": True, "data": data})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected"})

@app.route('/set_current', methods=['POST'])
def set_current():
    global serial_connection
    data = request.get_json()
    current = data.get('current')

    if serial_connection and serial_connection.is_open:
        try:
            command = f"setCurrent {current}\n"
            with lock:
                serial_connection.write(command.encode('utf-8'))
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected to serial port"})

@app.route('/set_duty_cycle', methods=['POST'])
def set_duty_cycle():
    global serial_connection
    data = request.get_json()
    duty_cycle = data.get('dutyCycle')

    if serial_connection and serial_connection.is_open:
        try:
            command = f"setDutyCycle {duty_cycle}\n"
            with lock:
                serial_connection.write(command.encode('utf-8'))
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected to serial port"})

@app.route('/write', methods=['POST'])
def write_data():
    global serial_connection
    data = request.get_json()
    write_data = data.get('data')

    if serial_connection and serial_connection.is_open:
        try:
            command = f"{write_data}\n"
            with lock:
                serial_connection.write(command.encode('utf-8'))
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False, "error": "Not connected to serial port"})


if __name__ == '__main__':
    app.run(debug=True)
