import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  user:any =JSON.parse(localStorage.getItem('user') || '') ;


  x: any;

  constructor(private router: Router, ) { }

  ngOnInit(): void {
    console.log(this.user);
    
    
  }
  myFunction() {
    this.x = document.getElementById("myTopnav");
    if (this.x.className === "topnav") {
      this.x.className += " responsive";
    } else {
      this.x.className = "topnav";
    }
  }

  
}
