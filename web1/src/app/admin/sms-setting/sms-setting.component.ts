import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sms-setting',
  templateUrl: './sms-setting.component.html',
  styleUrls: ['./sms-setting.component.css']
})
export class SmsSettingComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '' ).ID;
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '')
  
  constructor() { }

  
  smsSettingList: any = [
    {MessageName: 'Billing (Advance)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Billing (Final Delivery)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Billing (Order Ready)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Birthday', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Anniversary', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Eye Testing', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Contactlens Expiry', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Solution Expiry', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Credit Note', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Comfort Feedback', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Service', MessageID: '', Required: true, MessageText: ''},
  ];

  whatsappSettingList: any = [
    {MessageName1: 'Customer_Birthday', MessageText1: ''},
    {MessageName1: 'Customer_Anniversary', MessageText1: ''},
    {MessageName1: 'Customer_Bill Advance', MessageText1: ''},
    {MessageName1: 'Customer_Bill FinalDelivery', MessageText1: ''},
    {MessageName1: 'Customer_Bill OrderReady', MessageText1: ''},
    {MessageName1: 'Customer_Eye Testing', MessageText1: ''},
    {MessageName1: 'Customer_Eye Prescription', MessageText1: ''},
    {MessageName1: 'Customer_Contactlens Expiry', MessageText1: ''},
    {MessageName1: 'Customer_Solution Expiry', MessageText1: ''},
    {MessageName1: 'Customer_Credit Note', MessageText1: ''},
    {MessageName1: 'Customer_Comfort Feedback', MessageText1: ''},
    {MessageName1: 'Customer_Service', MessageText1: ''},
  ];

  ngOnInit(): void {
    let tempSMS = JSON.parse(this.companySetting.SmsSetting) || '';
    if (tempSMS.length !== 0){
      this.smsSettingList = tempSMS
    } 
    this.getwhst()
  }

  getwhst(){
    let tempwhatsSMS = JSON.parse(this.companySetting.WhatsappSetting) || '';
    if (tempwhatsSMS.length !== 0 && tempwhatsSMS !== null){
    this.whatsappSettingList = tempwhatsSMS
    }
  }

  onChange(event: string) {
    let modifiedEvent = event; // Create a new variable to store the modified result
    if (this.companySetting?.DataFormat === '1') {
      modifiedEvent = event.toUpperCase();
    } else if (this.companySetting?.DataFormat === '2') {
      modifiedEvent = this.toTitleCase(event);
    }
    return modifiedEvent;
  }

  toTitleCase(inputString: string) {
    // Implement a function to convert inputString to title case
    return inputString.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
      return $1.toUpperCase();
    });
  }
}
