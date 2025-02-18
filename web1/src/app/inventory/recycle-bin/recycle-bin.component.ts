import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-recycle-bin',
  templateUrl: './recycle-bin.component.html',
  styleUrls: ['./recycle-bin.component.css']
})
export class RecycleBinComponent implements OnInit {

  constructor() { }

  data = {FromDate:'',ToDate:'',UserName:'',ShopName:'',shopList:''}
  userList:any=[]
  shopList:any=[]

  ngOnInit(): void {
  }

}
