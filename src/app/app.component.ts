/// <reference types="web-bluetooth" />
import { Component } from '@angular/core';

import * as struct from 'python-struct';
import { Buffer } from 'buffer';

struct.sizeOf('>iixxQ10sb'); // --> 29

struct.pack('>iixxQ10sb', [
  1234,
  5678,
  require('long').fromString('12345678901234567890'),
  'abcdefg',
  true,
]); // --> <Buffer 00 00 04 d2 00 00 16 2e 00 00 ab 54 a9 8c eb 1f 0a d2 61 62 63 64 65 66 67 00 00 00 01>

struct.unpack(
  '>iixxQ10sb',
  Buffer.from(
    '000004d20000162e0000ab54a98ceb1f0ad26162636465666700000001',
    'hex'
  )
); // --> [ 1234, 5678, 12345678901234567890, 'abcdefg', 1 ]

struct.sizeOf('>iixxQ10sb'); // --> 29

const test = struct.pack('>iixxQ10sb', [
  1234,
  5678,
  require('long').fromString('12345678901234567890'),
  'abcdefg',
  true,
]); // --> <Buffer 00 00 04 d2 00 00 16 2e 00 00 ab 54 a9 8c eb 1f 0a d2 61 62 63 64 65 66 67 00 00 00 01>

console.log(test);
struct.unpack(
  '>iixxQ10sb',
  Buffer.from(
    '000004d20000162e0000ab54a98ceb1f0ad26162636465666700000001',
    'hex'
  )
); // --> [ 1234, 5678, 12345678901234567890, 'abcdefg', 1 ]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  myCharacteristic: any;
  backgroundColor = '';
  value = '0';

  async onButtonClick() {
    let serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    let characteristicUuidTx = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    let characteristicUuidRx = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    let device = null;

    try {
      console.log('Requesting Bluetooth Device...');
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }, { name: 'robot' }],
      });

      console.log('Connecting to GATT Server...');
      const server = await device.gatt?.connect();

      console.log('Getting Service...');
      const service = await server?.getPrimaryService(serviceUuid);

      console.log('Getting Characteristics...');
      const characteristics = await service?.getCharacteristics(
        characteristicUuidTx
      );

      if (characteristics && characteristics.length > 0) {
        this.myCharacteristic = characteristics[0];

        /* console.log('Reading Characteristics...');
        const value = await myCharacteristic.readValue();
        const decoder = new TextDecoder('utf-8');
        console.log(decoder.decode(value)); */

        const encoder = new TextEncoder();
        const text = 'on';
        await this.myCharacteristic.writeValue(encoder.encode(text));
      }

      console.log('Getting Characteristics...');
      const characteristicsRx = await service?.getCharacteristics(
        characteristicUuidRx
      );

      if (characteristicsRx && characteristicsRx.length > 0) {
        const myCharacteristic = characteristicsRx[0];

        await myCharacteristic.startNotifications();
        myCharacteristic.addEventListener(
          'characteristicvaluechanged',
          (event: any) => {
            const value = event.target.value;
            const decoder = new TextDecoder('utf-8');
            console.log(decoder.decode(value));
            this.value = decoder.decode(value);
          }
        );

        console.log('Waiting 60 seconds to receive data from the device...');
        await this.sleep(600 * 1000);
      }
    } catch (error) {
      console.log('Argh! ' + error);
    }

    /* if (device) {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
        console.log('disconnect');
      }
    } */
  }

  async sleep(ms: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(0);
      }, ms);
    });
  }
  async buttonOn() {
    const encoder = new TextEncoder();
    const text = 'on';
    await this.myCharacteristic.writeValue(encoder.encode(text));
  }

  async buttonOff() {
    const encoder = new TextEncoder();
    const text = 'off';
    await this.myCharacteristic.writeValue(encoder.encode(text));
  }

  async buttonReset() {
    const encoder = new TextEncoder();
    const text = 'reset';
    this.value = '0';
    await this.myCharacteristic.writeValue(encoder.encode(text));
  }

  async sendBle(message: string) {
    console.log(message);
    const encoder = new TextEncoder();
    const text = message;
    await this.myCharacteristic.writeValue(encoder.encode(text));
  }

  backgroundColorChange(e: any) {
    console.log(e);
    this.sendBle('0X' + e.color.hex.substring(1).toUpperCase());
  }
}
