import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashcard',
  templateUrl: './dashcard.component.html',
  styleUrls: ['./dashcard.component.css']
})
export class DashcardComponent implements OnInit {

  constructor() { }
  
  @Input() title: any;
  @Input() icon: any;
  @Input() routersLinks: any;
  x:any
  ngOnInit(): void {
  }

  function() {
    for (let i = 0; i < 9; i++) {
      const element = document.getElementById(`collapseExample${i}`);
      if (element && element.style.display === "block") {
        element.style.display = "none";
      }
      
      const element1 = document.getElementById(`collapseExample`);
      if (element1 && element1.style.display === "block") {
        element1.style.display = "none";
      }
    }
  }
  
}
