var fs = require('fs'),
	sleep = require('sleep')

MIN_DUTY_NS = 500000
MAX_DUTY_NS = 2000000
PWM_FRECUENCY = 50 //hz
DEGREE_TO_NS = (MAX_DUTY_NS-MIN_DUTY_NS)/180

PWM_PATH = "/sys/class/pwm/"

var gpio0 = 0,
	gpio1 = gpio0+32,
	gpio2 = gpio1+32,
	gpio3 = gpio2+32

var pwm_pins = {
    "P8_13": { "name": "EHRPWM2B", "gpio": gpio0+23, "mux": "gpmc_ad9", "eeprom": 15, "pwm" : "ehrpwm.2:1" },
    "P8_19": { "name": "EHRPWM2A", "gpio": gpio0+22, "mux": "gpmc_ad8", "eeprom": 14, "pwm" : "ehrpwm.2:0" },
    "P9_14": { "name": "EHRPWM1A", "gpio": gpio1+18, "mux": "gpmc_a2", "eeprom": 34, "pwm" : "ehrpwm.1:0" },
    "P9_16": { "name": "EHRPWM1B", "gpio": gpio1+19, "mux": "gpmc_a3", "eeprom": 35, "pwm" : "ehrpwm.1:1" },
    "P9_31": { "name": "SPI1_SCLK", "gpio": gpio3+14, "mux": "mcasp0_aclkx", "eeprom": 65 , "pwm": "ehrpwm.0:0" },
    "P9_29": { "name": "SPI1_D0", "gpio": gpio3+15, "mux": "mcasp0_fsx", "eeprom": 61 , "pwm": "ehrpwm.0:1" },
    "P9_42": { "name": "GPIO0_7", "gpio": gpio0+7, "mux": "ecap0_in_pwm0_out", "eeprom": 4, "pwm": "ecap.0" },
    "P9_28": { "name": "SPI1_CS0", "gpio": gpio3+17, "mux": "mcasp0_ahclkr", "eeprom": 63, "pwm": "ecap.2" },
}

var Servo = {
	pin: undefined,
	lastValue: undefined,
	attached: undefined,
	attach: function(pin) {
		
		if ( !pwm_pins[pin] ) {	
			console.log('Pin ' + pin + ' is not pwm capable')
		}

		else {
			this.pin = PWM_PATH + pwm_pins[pin]["pwm"]

			var val = fs.open(this.pin + "request").read() // read?  what the js equivalent
			if (val.find('free') < 0){
				console.log('Pin ' + pin + ' is already in use')
			}
				
			this.lastValue = 0
			
			fs.writeFileSync(this.pin + "/request", "1")
			fs.writeFileSync(this.pin + "/run", "0")
			fs.writeFileSync(this.pin + "/period_freq", String(PWM_FRECUENCY))
			fs.writeFileSync(this.pin + "/duty_ns", String(MIN_DUTY_NS))
			fs.writeFileSync(this.pin + "/run", "1")

			this.attached = true
		}
	},

	write: function(value){
		var duty_ns = MIN_DUTY_NS + value * DEGREE_TO_NS
		this.lastValue = value
		fs.writeFileSync(this.pin + "/duty_ns", String(duty_ns))
	},

	writeMicroseconds: function(value){		
		fs.writeFileSync(this.pin + "/duty_ns", String(value)+"000")
	},

	read: function(){
		return this.lastValue
	},

	detach: function(){
		fs.writeFileSync(this.pin + "/run", "0")		
		fs.writeFileSync(this.pin + "/request", "0")
		this.attached = false
	}	
}

var servo = Object.create( Servo )

servo.attach("P9_14")

console.log( "To middle" )
servo.writeMicroseconds(1500) //to middle
sleep.sleep(1)

console.log( "To max" )
servo.writeMicroseconds(2000) //max
sleep.sleep(1)

console.log( "To min" )
servo.writeMicroseconds(500) //min
sleep.sleep(1)
// The value in microseconds can change between servos. You can use this function to obtain the max and min values.
// Next, you can use this values to fix the servo class to your own servos (if you need it)

var i = 0
while ( i <= 180 ){
	//Angle from 0 to 180 degrees
	servo.write(i)
	sleep.sleep(0.02)
	i++
}


while ( i >= 0) {
	servo.write(i)
	sleep.sleep(0.02)
	i--
}

servo.detach()

