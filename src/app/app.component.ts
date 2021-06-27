/// <reference types="web-bluetooth" />
import { Component, OnInit } from '@angular/core';

import * as struct from 'python-struct';
import { Buffer } from 'buffer';
import { Observable, Subscription, timer } from 'rxjs';

// Format "bbbbBBiiB", l_stick_hor, l_stick_ver, r_stick_hor, r_stick_ver, l_trigger, r_trigger, setting1, setting2, buttons_char

struct.sizeOf('bbbbBBiiB'); // --> 29

const panic = struct.pack('bbbbBBiiB', [0, 0, 0, 0, 0, 0, 0, 0, 0]);
//const test = struct.pack('bbbbBBiiB', [-128, 127, -128, 127, 255, 255, 0, 0, 255]);
const test = struct.pack('bbbbBBiiB', [127, 0, -127, 0, 0, 0, 0, 0, 0]);

console.log(test);
struct.unpack(
  'bbbbBBiiB',
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
export class AppComponent implements OnInit {
  lStickHor: number | null = 0;
  lStickVer: number | null = 0;
  rStickHor: number | null = 0;
  rStickVer: number | null = 0;
  lTrigger: number | null = 0;
  rTrigger: number | null = 0;
  setting1: number | null = 0;
  setting2: number | null = 0;
  buttonsChar: number | null = 0;
  device: BluetoothDevice | null = null;
  timerSource: Observable<number> | null = null;
  timerSubscription: Subscription | null = null;
  myCharacteristic: any;
  backgroundColor = '';
  value = '0';
  dragPosition = { x: 0, y: 0 };

  ngOnInit() {
    this.timerSource = timer(1000, 200);
    this.timerSubscription = this.timerSource.subscribe((val) =>
      this.updateRobot()
    );
  }

  async onButtonClick() {
    let serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
    let characteristicUuidTx = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
    let characteristicUuidRx = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
    this.device = null;

    try {
      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }, { name: 'robot' }],
      });

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt?.connect();

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
    await this.myCharacteristic.writeValue(test);
  }

  async buttonOff() {
    await this.myCharacteristic.writeValue(panic);
    this.lStickHor = 0;
    this.lStickVer = 0;
    this.rStickHor = 0;
    this.rStickVer = 0;
    this.lTrigger = 0;
    this.rTrigger = 0;
    this.setting1 = 0;
    this.setting2 = 0;
    this.buttonsChar = 0;
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

  async updateRobot() {
    // Format "bbbbBBiiB", l_stick_hor, l_stick_ver, r_stick_hor, r_stick_ver, l_trigger, r_trigger, setting1, setting2, buttons_char
    struct.sizeOf('bbbbBBiiB'); // --> 29

    const sendData = struct.pack('bbbbBBiiB', [
      this.lStickHor ?? 0,
      this.lStickVer ?? 0,
      this.rStickHor ?? 0,
      this.rStickVer ?? 0,
      this.lTrigger ?? 0,
      this.rTrigger ?? 0,
      this.setting1 ?? 0,
      this.setting2 ?? 0,
      this.buttonsChar ?? 0,
    ]);
    await this.myCharacteristic?.writeValue(sendData);
  }
  dragMoved(e: any) {
    console.log(e.source.getFreeDragPosition());
    this.dragPosition = e.source.getFreeDragPosition();
    const position = e.source.getFreeDragPosition();
    this.lStickHor = position.x - 124;
    this.rStickVer = -position.y + 124;
  }
}
