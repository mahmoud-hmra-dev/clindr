import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
    selector: 'app-doctor-profile-settings',
    templateUrl: './doctor-profile-settings.component.html',
    styleUrl: './doctor-profile-settings.component.scss',
    standalone: false
})
export class DoctorProfileSettingsComponent implements OnInit {
  public routes = routes;
  loading = false;
  error = '';
  success = '';
  selectedFile: File | null = null;
  profileForm: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    display_name: ['', Validators.required],
    designation: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    languages: this.fb.array([]),
    profile_image_path: [''],
    accepting_new_patients: [false],
    memberships: this.fb.array([]),
  });

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  get memberships(): FormArray {
    return this.profileForm.get('memberships') as FormArray;
  }

  get languages(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }

  addMembership(data: any = { title: '', description: '' }) {
    this.memberships.push(
      this.fb.group({
        title: [data.title || '', Validators.required],
        description: [data.description || ''],
      })
    );
  }

  removeMembership(index: number) {
    this.memberships.removeAt(index);
  }

  loadProfile(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        const langsRaw = doctor?.languages_json ?? doctor?.languages ?? [];
        const langs: string[] = Array.isArray(langsRaw)
          ? langsRaw
          : typeof langsRaw === 'string'
            ? langsRaw.split(',').map((l: string) => l.trim()).filter((l: string) => l)
            : [];
        const membershipsRaw = Array.isArray(doctor?.memberships) ? doctor.memberships : [];
        this.profileForm.patchValue({
          first_name: doctor?.first_name || '',
          last_name: doctor?.last_name || '',
          display_name: doctor?.display_name || '',
          designation: doctor?.designation || '',
          phone: doctor?.phone || '',
          email: doctor?.email || '',
          profile_image_path: doctor?.profile_image_path || '',
          accepting_new_patients: !!doctor?.accepting_new_patients,
        });
        this.languages.clear();
        langs.forEach((lang: string) =>
          this.languages.push(this.fb.control(lang))
        );
        if (!this.languages.length) this.addLanguage();
        this.memberships.clear();
        membershipsRaw.forEach((m: any) =>
          this.addMembership({ title: m.title || m.name, description: m.description })
        );
        if (!this.memberships.length) this.addMembership();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load profile';
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.profileForm.value,
      languages_json: this.languages.value,
      languages: this.languages.value,
      memberships: (this.memberships.value || []).map((m: any) => ({
        title: m.title,
        description: m.description,
      })),
      profile_image_file: this.selectedFile || undefined,
    };
    this.loading = true;
    this.error = '';
    this.success = '';
    this.doctorService.updateMyProfile(payload).subscribe({
      next: () => {
        this.success = 'Profile updated successfully';
        this.loadProfile();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update profile';
        this.loading = false;
      },
    });
  }

  onImageSelected(event: any): void {
    const file = event?.target?.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.profileForm.get('profile_image_path')?.setValue(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.profileForm.get('profile_image_path')?.setValue('');
    this.selectedFile = null;
  }

  scrollToSection(section?: HTMLElement | null): void {
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  addLanguage(value: string = ''): void {
    this.languages.push(this.fb.control(value, Validators.required));
  }

  removeLanguage(index: number): void {
    this.languages.removeAt(index);
    if (!this.languages.length) {
      this.addLanguage();
    }
  }
}
