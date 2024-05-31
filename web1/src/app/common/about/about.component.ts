import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { }

  data: any = [
    {
      "parentName": "31-05-2024",
      "childProperties":
        [
          { "propertyName": `1. Customer Category: Now you can find your customer category wise` },
          { "propertyName": "* Follow steps " },
          { "propertyName": "(A) Administration > Shop > Customer Category" },
          { "propertyName": "(B) Category will auto show on customer page, beside customer id" },
          { "propertyName": "#Example" },
          { "propertyName": "0 to 500 Rs = *" },
          { "propertyName": "500 to 1500 Rs = **" },
          { "propertyName": "1500 to 3500 Rs = ***" },
          { "propertyName": "3500 to 6000 Rs. = ****" },
          { "propertyName": "6000 to 50000 Rs. = *****" },

          { "propertyName": "2. Purchase price change option in inventory report and you can print barcode on same page." },
          { "propertyName": "Report => Inventory Report => purchase price button" },
          { "propertyName": "Note: Following use for this report" },
          { "propertyName": "(A) If Rayban or other company change the price. So you can easily change" },
          { "propertyName": "(B) If you lose your barcode then you can easily print from here" },
         
          { "propertyName": "3. Mr., Mrs., Dr., Adv etc option add on Bill Print, prescription Print and all whatsapp message format." },
          { "propertyName": "4. Reg No. add on bill page. You can put your manually bill book no here. And easily search your record." },
          { "propertyName": "5. Ledger Report complete for Supplier & Customers. * Follow steps: Report => Ledger report" },
          { "propertyName": "6. Loyalty(Commission)  report done for Employee and Doctor. * Follow steps: Report => Loyalty Report" },
          { "propertyName": "7. Employee Document upload option for security purpose. * Follow steps: Administration => Employee => Edit Employee => Upload Doc" },
          { "propertyName": "8. GST Filling report. * Follow steps: Report => GST Filling" },
          { "propertyName": "9. Product Search option add. Now you can search your product easily " },
          { "propertyName": "Ex: Type Rayban and search no need select Frame, Full Frame or sunglass" },
          { "propertyName": "* Follow steps: Report => Sale, Purchase, Inventory and all necessary Reports" },
        ]
    },
    {
      "parentName": "27-04-2024",
      "childProperties":
        [
          { "propertyName": "1. Universal Language integration with WhatsApp messages. Now you can send sms in Hindi, Marathi, Arabic etc." },
          { "propertyName": "2. Inventory Report- All stock buttons are added in the report. Click on all stock buttons and check your stock in a single click." },
          { "propertyName": "3. Opening/Closing stock report merge in Inventory Report(amount wise/Qty wise) till 30 April report will be in testing mode. From 1 May 2024 will be working." },
          { "propertyName": "4. Old Customer power Change date option added in customer page." },
          { "propertyName": "5. You can make the lens price list easily with power. Call OPTICALGURU for this feature." },
        ]
    },
    {
      "parentName": "19-02-2024 ",
      "childProperties":
        [
          { "propertyName": "1. Customer Order Ready WhatsApp message integration." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Customer List" },
          { "propertyName": "(B) Sale Report => Product pending Report" },
         
        ]
    },
    {
      "parentName": "08-02-2024",
      "childProperties":
        [
          { "propertyName": "1. WhatsApp SMS format done with your software, Please read and cross check." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Go to Administration => SMS setting => Whatsapp Seeting" },
        ]
    },
    {
      "parentName": "28-01-2024",
      "childProperties":
        [
          { "propertyName": "1. Watermark on Bill." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Go to administration Click on shop => click on edit button => Upload watermark image with only png format => then click on update button => After Software logout and login." },
          { "propertyName": "2. If you want to adjust the watermark on Bill format." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Go to administration => click on company settings => click on bill format => adjust and save." },
        ]
    },
    {
      "parentName": "26-01-2024",
      "childProperties":
        [
          { "propertyName": "1. Employee profile added with logout button. check in employee login." },
          { "propertyName": "2. New option added for employees Discount permission after the bill" },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A)Click on the administration on the menu bar" },
          { "propertyName": "(B)Click on the employee" },
          { "propertyName": "(C)Click on the edit button" },
          { "propertyName": "(D)On/off option Discount permission after the bill" },
        ]
    },
    {
      "parentName": "17-01-2024",
      "childProperties":
        [
          { "propertyName": "1. Expenses Report Total Calculation Done." },
          { "propertyName": "2. Expenses type filter done on expenses Report." },
          { "propertyName": "3. Date auto fill on the expenses page." },
          { "propertyName": "4. Reminder pop up correct." },
      
        ]
    },
    {
      "parentName": "12-01-2024",
      "childProperties":
        [
          { "propertyName": "1. Add the WhatsApp button on the billing page for the final delivery message." },
          { "propertyName": "2. Add the WhatsApp button on the sale Report page to send a message to the customer 'your balance amount due please clear today'" },
          { "propertyName": "3. Report : with all reports there is a Filter option with red colour.  You can print reports with your needs." },
          { "propertyName": "* Follow few steps" },
          { "propertyName": "(A) Click on the Report option on the menu bar" },
          { "propertyName": "(B) Click on the sale Report" },
          { "propertyName": "(C) Select Date Range with filter payment status unpaid option" },
          { "propertyName": "(D) Click on the search button" },
          { "propertyName": "(E) There is a whatsapp button" },
          { "propertyName": "(E) Click and send sms" },

      
        ]
    },
  ];

  ngOnInit(): void {
  }

  toggleAccordian(event: any, index: any) {
    const element = event.target;
    element.classList.toggle("active");
    if (this.data[index].isActive) {
      this.data[index].isActive = false;
    } else {
      this.data[index].isActive = true;
    }
    const panel = element.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  }
}
