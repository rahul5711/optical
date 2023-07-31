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

  ngOnInit(): void {
  }

}
