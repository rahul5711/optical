export class CustomerModel {
  'ID': number | string;
  'CompanyID': number | string;
  'Idd': number ;
  'Sno': number | string;
  'TotalCustomer': number | string;
  'VisitDate': number | string;
  'Name': string;
  'MobileNo1': number | string;;
  'MobileNo2': number | string;;
  'PhoneNo': number | string;;
  'Address': number | string;;
  'Email': any ;
  'GSTNo': any ;
  'PhotoURL': any;
  'DOB': any ;
  'Age': number;
  'Anniversary': any;
  'RefferedByDoc': string;
  'ReferenceType': string;
  'Gender': string;
  'Category': string;
  'Other': string;
  'Remarks': any;
  'Status': number;
  'CreatedBy': number;
  'CreatedOn': any;
  'UpdatedBy': number;
  'UpdatedOn': any;
  'tablename': any;
  'spectacle_rx': any;
  'contact_lens_rx': any;
  'other_rx': any;
}

export class SpectacleModel {
  'ID': any;
  'CustomerID': any;
  'REDPSPH': number | string;
  'REDPCYL': number | string;
  'REDPAxis': number | string;
  'REDPVA': number | string;
  'LEDPSPH': number | string;
  'LEDPCYL': number | string;
  'LEDPAxis': number | string;
  'LEDPVA': number | string;
  'RENPSPH':  number | string;
  'RENPCYL':  number | string;
  'RENPAxis': number | string;
  'RENPVA': number | string;
  'LENPSPH': number | string;
  'LENPCYL': number | string;
  'LENPAxis': number | string;
  'LENPVA': number | string;
  'REPD': number | string;
  'LEPD': number | string;
  'R_Addition': number | string;
  'L_Addition': number | string;
  'R_Prism': number | string;
  'L_Prism': number | string;
  'Lens': number | string;
  'Shade': number | string;
  'Frame': number | string;
  'VertexDistance': number | string;
  'RefractiveIndex': number | string;
  'FittingHeight': number | string;
  'ConstantUse': boolean;
  'NearWork': boolean;
  'DistanceWork': boolean;
  'UploadBy': any;
  'PhotoURL': any;
  'FileURL': any;
  'Family': number | string;
  'RefferedByDoc': number | string;
  'Reminder': number | string;
  'ExpiryDate': any;
  'Status': number;
  'CreatedBy': number;
  'CreatedOn': any;
  'UpdatedBy': number;
  'UpdatedOn': any;
  
}

export class ContactModel {
  'ID': number | string;
  'CustomerID': number | string;
  'REDPSPH': number | string;
  'REDPCYL': number | string;
  'REDPAxis': number | string;
  'REDPVA': number | string;
  'LEDPSPH': number | string;
  'LEDPCYL': number | string;
  'LEDPAxis': number | string;
  'LEDPVA': number | string;
  'RENPSPH':  number | string;
  'RENPCYL':  number | string;
  'RENPAxis': number | string;
  'RENPVA': number | string;
  'LENPSPH': number | string;
  'LENPCYL': number | string;
  'LENPAxis': number | string;
  'LENPVA': number | string;
  'REPD': number | string;
  'LEPD': number | string;
  'R_Addition': number | string;
  'L_Addition': number | string;
  'R_KR': number | string;
  'L_KR': number | string;
  'R_HVID': number | string;
  'L_HVID': number | string;
  'R_CS': number | string;
  'L_CS': number | string;
  'R_BC': number | string;
  'L_BC': number | string;
  'R_Diameter': number | string;
  'L_Diameter': number | string;
  'BR': number | string;
  'Material': number | string;
  'Modality': number | string;
  'Other': number | string;
  'ConstantUse': boolean;
  'NearWork': boolean;
  'DistanceWork': boolean;
  'Multifocal': boolean;
  'PhotoURL': any;
  'FileURL': any;
  'Family': number | string;
  'RefferedByDoc': number | string;
  'Status': number;
  'CreatedBy': number;
  'CreatedOn': any;
  'UpdatedBy': number;
  'UpdatedOn': any;
  
}


export class OtherModel {
  'ID': number | string;
  'CustomerID': number | string;
  'BP': number | string;
  'Sugar': number | string;
  'IOL_Power': number | string;
  'RefferedByDoc': string;
  'Operation': number | string;
  'R_VN': number | string;
  'L_VN': number | string;
  'R_TN': number | string;
  'L_TN':  number | string;
  'R_KR':  number | string;
  'L_KR': number | string;
  'Treatment': number | string;
  'Diagnosis': number | string;
  'Family': number | string;
  'FileURL': any;
  'Status': number;
  'CreatedBy': number;
  'CreatedOn': any;
  'UpdatedBy': number;
  'UpdatedOn': any;
  
}

