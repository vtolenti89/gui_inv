import serial
import json
import time
import random

# Configure the same port used by the Flask frontend (adjust as needed)
SERIAL_PORT = 'COM10'  # Replace with your test port
BAUDRATE = 115200

def gen_random(min_val=0.0, max_val=1.0, precision=2):
    value = random.uniform(min_val, max_val)
    if precision is not None:
        return round(value, precision)
    return value

def update_data(param , value):
    data[param] = round(value, 2)

# Define the JSON data to send
data = {
    "vin_rms": 400,
    "iin_rms": None,
    "vout_rms": None,
    "iout_rms": 0,
    "f_sw": 45000,
    "f_mains": 50,
    "dc": None,
    "r_load": round(15000/6.6**2,2),
    "t_hb1": None,
    "t_hb2": None,
    "t_pcb1": None,
    "t_pcb2": None,
    "mains_undervoltage": 0,
    "bus_overvoltage": 0,
    "hb1_fault": 0,
    "hb2_fault": 0,
    "contactor": 1,
    "door_switch": 1,
    "enable": 0,
    "safe_enable": 0
}


def main():
    try:
        with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1) as ser:
            print(f"[Device] Listening on {SERIAL_PORT}...")
            while True:
                if ser.in_waiting:
                    command = ser.readline().decode('utf-8').strip()
                    print(f"[Device] Received command: {command}")
                    
                    cmd, args = parse_command(command);
                    
                    if cmd == "pool_measurement":
                        # Simulated JSON response
                        update_data("vin_rms", 400 * gen_random(0.9, 1.1))
                        update_data("vout_rms", data["r_load"]*data["iout_rms"]*gen_random(0.9, 1.1))
                        update_data("iin_rms", data["vout_rms"]*data["iout_rms"]/data["vin_rms"])
                        # update_data("iout_rms", data["iout_rms"]*gen_random(0.9, 1.1))
                        # update_data("f_sw", data["f_sw"]*gen_random(0.9, 1.1))
                        update_data("f_mains", 50*gen_random(0.95, 1.05))
                        update_data("dc", data["iout_rms"]/data["iin_rms"] if data["iin_rms"] > 0 else 0 )
                        update_data("t_hb1", data["iout_rms"]/6.6*125*gen_random(0.9, 1.1))
                        update_data("t_hb2", data["iout_rms"]/6.6*125*gen_random(0.9, 1.1))
                        update_data("t_pcb1", data["iout_rms"]/6.6*125*gen_random(0.9, 1.1))
                        update_data("t_pcb2", data["iout_rms"]/6.6*125*gen_random(0.9, 1.1))
                        update_data("mains_undervoltage", round(gen_random(0.9, 1.1),0))
                        update_data("bus_overvoltage", round(gen_random(0.9, 1.1),0))
                        update_data("hb1_fault", round(gen_random(0.9, 1.1),0))
                        update_data("hb2_fault", round(gen_random(0.9, 1.1),0))
                        
                    
                    if cmd == 'set_current':
                        update_data("iout_rms", args[0])
                        
                    if cmd == 'set_contactor':
                        update_data("contactor", args[0])
                        
                    send_response(ser)
                        
    except serial.SerialException as e:
        print(f"[Device Error] {e}")

def parse_command(command_str):
    parts = command_str.strip().split()

    if not parts:
        return None, []

    command = parts[0]
    try:
        # Try converting arguments to float or int if possible
        args = [float(arg) if '.' in arg else int(arg) for arg in parts[1:]]
    except ValueError:
        # If conversion fails, treat as plain string
        args = parts[1:]

    return command, args

def send_response(ser):
    json_response = json.dumps(data)
    ser.write((json_response + '\n').encode('utf-8'))
    print(f"[Device] Sent JSON: {json_response}")


if __name__ == '__main__':
    main()

