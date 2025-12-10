import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-social-media',
    templateUrl: './social-media.component.html',
    styleUrls: ['./social-media.component.scss'],
    standalone: false
})
export class SocialMediaComponent implements OnInit {
  public routes = routes;

  form: FormGroup;
  saving = false;
  message = '';
  error = '';

  platforms = ['facebook', 'linkedin', 'twitter', 'instagram', 'youtube', 'tiktok', 'website'];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService
  ) {
    this.form = this.fb.group({
      social_links: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get socialLinks(): FormArray {
    return this.form.get('social_links') as FormArray;
  }

  private buildLinkRow(platform = '', url = ''): FormGroup {
    return this.fb.group({
      platform: [platform || '', [Validators.required]],
      url: [url || '', [Validators.required]]
    });
  }

  addLink(): void {
    this.socialLinks.push(this.buildLinkRow());
  }

  removeLink(index: number): void {
    this.socialLinks.removeAt(index);
  }

  loadProfile(): void {
    this.message = '';
    this.error = '';
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.socialLinks.clear();
        (data?.social_links || []).forEach((link: any) => {
          this.socialLinks.push(this.buildLinkRow(link.platform, link.url));
        });
        if (this.socialLinks.length === 0) {
          this.addLink();
        }
      },
      error: () => {
        this.error = 'Failed to load social links';
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';
    this.doctorService.updateMyProfile({ social_links: this.socialLinks.value }).subscribe({
      next: () => {
        this.message = 'Social links updated';
        this.saving = false;
      },
      error: () => {
        this.error = 'Failed to update social links';
        this.saving = false;
      }
    });
  }
}
