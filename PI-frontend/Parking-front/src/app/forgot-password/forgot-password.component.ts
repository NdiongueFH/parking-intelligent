import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  currentStep = 1;
  loading = false;
  error = '';
  resetSuccess = false;
  
  // États pour les mots de passe
  showPassword = false;
  showConfirmPassword = false;
  
  // Pour le code de vérification
  verificationCodeLength = 6;
  resendDisabled = false;
  resendCountdown = 60;
  countdownSubscription?: Subscription;
  
  // Infos utilisateur
  userEmail = '';
  resetToken = '';
  
  // Indicateur de force du mot de passe
  passwordStrength = 0;
  passwordStrengthColor = '#e0e0e0';
  passwordStrengthText = '';
  
  // Formulaires
  emailForm: FormGroup;
  verificationForm: FormGroup;
  passwordForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    // Initialisation des formulaires
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    // Création dynamique du formulaire de vérification
    const verificationControls: any = {};
    for (let i = 0; i < this.verificationCodeLength; i++) {
      verificationControls['digit' + i] = ['', [Validators.required, Validators.pattern('[0-9]')]];
    }
    this.verificationForm = this.fb.group(verificationControls);
    
    // Formulaire de mot de passe
    this.passwordForm = this.fb.group({
      new_password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirm_password: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  ngOnInit(): void {
    // Écouter les changements dans le mot de passe pour évaluer sa force
    this.passwordForm.get('new_password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }
  
  // Fonctions de navigation entre les étapes
  nextStep(): void {
    this.error = '';
    this.currentStep++;
  }
  
  prevStep(): void {
    this.error = '';
    this.currentStep--;
  }
  
  // Validation des champs
  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const control = form.get(fieldName);
    return !!control &&
           control.invalid &&
           (control.dirty || control.touched);
  }
  
  // Gestion des formulaires
  submitEmail(): void {
    if (this.emailForm.valid) {
      this.loading = true;
      this.error = '';
      
      this.http.post('http://localhost:3000/api/v1/auth/forgot-password', {
        email: this.emailForm.value.email
      }).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.userEmail = this.emailForm.value.email;
          this.nextStep();
          this.startResendCountdown();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'Adresse email non trouvée. Veuillez vérifier et réessayer.';
        }
      });
    } else {
      this.emailForm.markAllAsTouched();
    }
  }
  
  submitVerification(): void {
    if (this.verificationForm.valid) {
      this.loading = true;
      this.error = '';
      
      // Récupération du code complet
      const code = this.getFullVerificationCode();
      
      this.http.post('http://localhost:3000/api/v1/auth/verify-reset-code', {
        email: this.userEmail,
        code: code
      }).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.resetToken = response.resetToken; // Stocker le token pour la réinitialisation
          this.nextStep();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'Code de vérification incorrect. Veuillez réessayer.';
        }
      });
    } else {
      this.verificationForm.markAllAsTouched();
    }
  }
  
  submitNewPassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      this.error = '';
      
      this.http.post('http://localhost:3000/api/v1/auth/reset-password', {
        email: this.userEmail,
        resetToken: this.resetToken,
        newPassword: this.passwordForm.value.new_password
      }).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.resetSuccess = true;
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.';
        }
      });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }
  
  // Fonctions pour le code de vérification
  getVerificationControls(): any[] {
    return Array(this.verificationCodeLength).fill(0).map((_, i) => ({ name: 'digit' + i }));
  }
  
  onDigitInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    
    // Si un caractère a été saisi
    if (value.length === 1) {
      // Passer au champ suivant s'il existe
      if (index < this.verificationCodeLength - 1) {
        const nextInput = input.nextElementSibling;
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else if (value.length === 0 && event.key === 'Backspace') {
      // Si backspace est pressé dans un champ vide, passer au champ précédent
      if (index > 0) {
        const prevInput = input.previousElementSibling;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }
  
  getFullVerificationCode(): string {
    let code = '';
    for (let i = 0; i < this.verificationCodeLength; i++) {
      code += this.verificationForm.get('digit' + i)?.value || '';
    }
    return code;
  }
  
  resendCode(): void {
    if (this.resendDisabled) return;
    
    this.loading = true;
    this.http.post('http://localhost:3000/api/v1/auth/resend-code', {
      email: this.userEmail
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.startResendCountdown();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error.message || 'Impossible de renvoyer le code. Veuillez réessayer plus tard.';
      }
    });
  }
  
  startResendCountdown(): void {
    // Réinitialiser le compteur
    this.resendDisabled = true;
    this.resendCountdown = 60;
    
    // Annuler l'abonnement précédent s'il existe
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    
    // Démarrer le nouveau compteur
    this.countdownSubscription = interval(1000)
      .pipe(takeWhile(() => this.resendCountdown > 0))
      .subscribe(() => {
        this.resendCountdown--;
        if (this.resendCountdown === 0) {
          this.resendDisabled = false;
        }
      });
  }
  
  // Fonctions pour les mots de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('new_password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    
    if (password !== confirmPassword) {
      control.get('confirm_password')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }
  
  // Calcul de la force du mot de passe
  calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthColor = '#e0e0e0';
      this.passwordStrengthText = '';
      return;
    }
    
    let strength = 0;
    
    // Longueur
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Complexité
    if (/[a-z]/.test(password)) strength += 10;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    // Variété des caractères
    const uniqueChars = new Set(password).size;
    strength += uniqueChars > 4 ? 15 : 0;
    
    // Limiter à 100
    this.passwordStrength = Math.min(100, strength);
    
    // Définir la couleur et le texte
    if (this.passwordStrength < 40) {
      this.passwordStrengthColor = '#ff4d4d';
      this.passwordStrengthText = 'Faible';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthColor = '#ffa64d';
      this.passwordStrengthText = 'Moyen';
    } else {
      this.passwordStrengthColor = '#4dff4d';
      this.passwordStrengthText = 'Fort';
    }
  }
  
  // Pour s'assurer que la composante est détruite proprement
  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
}