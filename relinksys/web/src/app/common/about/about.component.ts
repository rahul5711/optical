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
      "parentName": "30-06-2025 - 4 Updates",
      "childProperties":
        [
          { "propertyName": "1. Traditional reports with graphical representation. Sale Report, Purchase Report and Expenses Report. Go to the Report > Check last Tab" },
          { "propertyName": "2. Email Automations - Auto mail send to all customers. (Like bill and reminders)" },
          { "propertyName": "3. Lenses Price list Excel import option." },
          { "propertyName": `4. Now we make 3 types of running software.\n 
            * Direct Bill Ex- When you make the bill or memo then software will be generate directly bill \n
            * Direct cash memo+ Direct bill Ex- You will be generate cash memo, once the customer payment clear then memo will be convert to invoice automatically. \n
            * Manual cash memo + Manual Bill convert option \n
            * Ex- You will be generate cash memo, after month and you will be decide you have to convert with invoice or not.`},
        ]
    },
    {
      "parentName": "19-03-2025 - 7 Updates",
      "childProperties":
        [
          { "propertyName": "1. Prime Membership card => Click on Customer page => click on  Extra button and share prime membership card to your customer" },
          { "propertyName": "2. Software design" },
          { "propertyName": "3. Recycle bin (Security) => Click on the Security option => Recycle bin => You can see staff deleted data. And track your records" },
          { "propertyName": "4. Summary report working on dashboard"},
          { "propertyName": "5. Reminder Notification: Check on Dashboard"},
          { "propertyName": "6. Reward WhatsApp => * Now you can send WhatsApp point to your customer => * Price wise filter point and send to customer"},
          { "propertyName": `7. Product Pending Report: Now you can delivered all product in a single click. Report => Sale Report => Product Pending => Search Data => Click on update button`},
        ]
    },
    {
      "parentName": "2-12-2024 - 5 Updates",
      "childProperties":
        [
          { "propertyName": "1. Security option on Menu bar => Physical stock tracking (Audit)" },
          { "propertyName": "2. Security option on Menu bar => Location Tracker" },
          { "propertyName": "3. Product Master => Discount setting: Now you can set brand wise discount" },
          { "propertyName": "4. Date format Correction"},
          { "propertyName": `5. software Shortcut Now you can operate software via '𝐊𝐄𝐘𝐁𝐎𝐀𝐑𝐃'  (Alt+First Letter of heading)`},
        ]
    },
    {
      "parentName": "10-11-2024 - 7 Updates",
      "childProperties":
        [
          { "propertyName": "1. Product Transfer => Now you can bulk product transfer with a single Code." },
          { "propertyName": "2. Paid Stamp and signature on bill Administration => shop => upload stamp and signature => click on the update button" },
          { "propertyName": "3. Currency on Bill Administration => company Setting => change Currency => click  on update company setting " },
          { "propertyName": "4. Report => Ledger Add Doctor, Employee, Fitter payment ledger" },
          { "propertyName": "5. Discount option add on service(Bill service) billing."},
          { "propertyName": "6. Power Show => In customer Bill history now you can see customer multiple bill with separate power."},
          { "propertyName": "7. Sale Rate disable option for staff Administration => Employee => Edit Employee => close sale price change permission button => click update button"},

        ]
    },
    {
      "parentName": "1-09-2024 - 5 Updates",
      "childProperties":
        [
          { "propertyName": "1. Customer Reward point" },
          { "propertyName": "2. Lens Grid View (Matrix) Purchase => Lens Grid View" },
          { "propertyName": "3. Text WhatsApp button add on Bill page." },
          { "propertyName": "4. Petty Cash and Cash Counter module" },
          { "propertyName": "5. Cash collection Report => Add basic calculations Collection - Expenses"},

        ]
    },
    {
      "parentName": "1-06-2024 - 9 Updates",
      "childProperties":
        [
          {
            "propertyName": "Customer Category: Now you can find your customer category wise"
          },
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
      "parentName": "27-04-2024 - 5 Updates",
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
      "parentName": "19-02-2024 - 1 Updates",
      "childProperties":
        [
          { "propertyName": "1. Customer Order Ready WhatsApp message integration." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Customer List" },
          { "propertyName": "(B) Sale Report => Product pending Report" },
         
        ]
    },
    {
      "parentName": "08-02-2024 - 1 Updates",
      "childProperties":
        [
          { "propertyName": "1. WhatsApp SMS format done with your software, Please read and cross check." },
          { "propertyName": "*Follow steps" },
          { "propertyName": "(A) Go to Administration => SMS setting => Whatsapp Seeting" },
        ]
    },
    {
      "parentName": "28-01-2024 - 2 Updates",
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
      "parentName": "26-01-2024 - 2 Updates",
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
      "parentName": "17-01-2024 - 4 Updates",
      "childProperties":
        [
          { "propertyName": "1. Expenses Report Total Calculation Done." },
          { "propertyName": "2. Expenses type filter done on expenses Report." },
          { "propertyName": "3. Date auto fill on the expenses page." },
          { "propertyName": "4. Reminder pop up correct." },
      
        ]
    },
    {
      "parentName": "12-01-2024 - 3 Updates",
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
