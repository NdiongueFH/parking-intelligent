import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router'; // Importez Router


@Component({
  selector: 'app-modification',
  standalone: true,
  imports: [ RouterModule],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class ModificationComponent implements OnInit {

  constructor(
    
  ) {}

  ngOnInit(): void {
    
  }


 

  onSubmit(): void {
    
    }

  
}
