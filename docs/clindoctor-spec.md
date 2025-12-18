Doctor pages – fields pulled from templates

appointment-list: filters (searchName, dateRange, appointmentType video/audio/chat/direct, visitType general/consultation/follow_up/direct), cards show appointmentId, patientName, scheduledDateTime, visitType, appointmentMode, patientEmail, patientPhone, status tabs upcoming/cancelled/completed, actions view/chat/cancel/start.
available-timings: general + per-clinic slots; clinic select {id,name,image}; dayOfWeek tabs; slots with time + space/capacity; appointmentFee; actions add/delete slot.
my-patients: filters like appointments + dateRange; cards show appointmentId, patientName, age, gender, bloodGroup, city, lastBookingDate.
doctor-specialities: speciality select; services [{serviceName, price, about}] per speciality; add/delete service, add speciality.
reviews: overallRating, dateRange filter; each review {patientName, createdAt, rating, comment, reply? {doctorName, createdAt, body}}.
invoices: table cols id, patientName, appointmentDate, bookedOn, amount; actions view/print.
chat-doctor: conversations (participant names/avatars, lastMessage, lastMessageAt, unreadCount, pinned, lastMessageType text/audio/video/file/location/call); messages {senderId, body, sentAt, type, attachmentUrl, status sent/delivered/read, reactions, forwarded, replyTo?, location/voice flags}.
doctor-profile-settings: profileImage, firstName, lastName, displayName, designation, phone, email, languages[], memberships[{title, about}].
social-media: links [{platform facebook/linkedin/twitter/instagram, url}].
doctor-change-password: oldPassword, newPassword, confirmPassword.
Patient pages – fields pulled from templates

patient-dashboard: vitals (heartRate, bodyTemperature, glucoseLevel, spo2, bloodPressure, bmi, lastVisitDate); favourites list (doctorName, speciality, rating, nextAvailabilityDate, location, lastBookedOn); appointment cards (doctorName, speciality, appointmentType clinic/video, scheduledDateTime, actions chat/attend); notifications {message, type, createdAt}; analytics/graphs (bookings/reschedules/cancellations counts); tables for prescriptions/invoices/appointments use ids, doctorName, date/time, status, amounts.
patient-appointments: filters (search, dateRange, appointmentType, visitType); list shows appointmentId, doctorName, scheduledDateTime, visitType, appointmentMode, doctorEmail, doctorPhone, status tabs upcoming/cancelled/completed.
favourites: doctor cards with doctorName, speciality, rating, nextAvailabilityDate, location, lastBookedOn, verified, favouriteToggle, actions view/book.
dependent-list/add: dependent {name, gender, relationship, age, bloodGroup, phone?, email?, isActive}; add/edit modal with those fields.
medical-records: medical records table {id, name/recordType, date, recordFor patient/dependent, comments}; prescriptions table {id, name, createdAt, prescribedBy doctor}; actions view/download/delete.
patient-accounts: wallet summary {totalBalance, totalTransaction, lastPaymentRequestAt}; bankDetails {bankName, accountNumber, branchName, accountName}; transactions table {id, accountNo, reason, debitedOrCreditedOn, amount, status}.
patient-invoice: table {id, doctorName, appointmentDate, bookedOn, amount, actions view/download}.
chat: same structure as doctor chat (conversations/messages as above).
medical-details: vitals summary (bloodPressure, heartRate, glucoseLevel, bodyTemperature, bmi, spo2, lastUpdateAt); vitals table {id, patientName, bmi, heartRate, fbcStatus, weight, addedOn}.
profile-settings: profilePhoto; firstName, lastName, dob, phone, email, bloodGroup; address, city, state, country, pincode; nav to changePassword/2FA/deleteAccount.
Entity → TS interface (camelCase) → DB columns (snake_case) map

User: {id, name, email, phone, password, role} → users(id, name, email, phone, password, role, email_verified_at). Roles via spatie.
Doctor: {id, userId, firstName, lastName, displayName, designation, phone, email, languages: string[], profileImage, bio?, rating?, feeDefault?, location?} → doctors(id, user_id, first_name, last_name, display_name, designation, phone, email, languages_json, profile_image_path, bio, rating_avg, default_fee, city, country).
Patient: {id, userId, firstName, lastName, dob, bloodGroup, phone, email, address, city, state, country, pincode} → patients(id, user_id, first_name, last_name, dob, blood_group, phone, email, address, city, state, country, pincode).
Specialty: {id, name, description?} → specialties(id, name, description).
DoctorService/SpecialityService: {id, doctorId, specialtyId, name, price, description} → doctor_services(id, doctor_id, specialty_id, name, price, description).
Clinic: {id, doctorId, name, address, city, imageUrl?} → clinics(id, doctor_id, name, address, city, image_url).
DoctorAvailability: {id, doctorId, clinicId?, dayOfWeek, startTime, slotCapacity, fee} → doctor_availabilities(id, doctor_id, clinic_id, day_of_week, start_time, slot_capacity, fee_amount).
Appointment: {id, doctorId, patientId, appointmentType in_clinic|online, visitType general|consultation|follow_up|direct, scheduledAt, durationMinutes, status pending|confirmed|completed|cancelled|no_show, reason?, notes?, clinicLocation?, onlineMeetingUrl?, twilioRoomSid?, areebaTransactionId?, areebaPaymentStatus pending|authorized|paid|failed|refunded, createdBy, cancelledBy?, cancelledReason?, patientEmail?, patientPhone?} → appointments table with same snake_case columns.
Dependent: {id, patientId, name, gender, relationship, phone?, email?, bloodGroup?, dob?, isActive} → dependents(id, patient_id, name, gender, relationship, phone, email, blood_group, dob, is_active).
MedicalRecord: {id, patientId, dependentId?, doctorId?, appointmentId?, recordType, title, date, comments?, fileUrl?} → medical_records(id, patient_id, dependent_id, doctor_id, appointment_id, record_type, title, recorded_at, comments, file_url).
Prescription: {id, appointmentId, patientId, doctorId, name, issuedAt, fileUrl?} → prescriptions(id, appointment_id, patient_id, doctor_id, name, issued_at, file_url).
Review: {id, appointmentId, doctorId, patientId, rating, comment, createdAt, replyText?, replyBy?, replyAt?} → reviews(id, appointment_id, doctor_id, patient_id, rating, comment, created_at, reply_text, reply_user_id, reply_at).
Invoice: {id, appointmentId, doctorId, patientId, amount, currency, bookedOn, status paid/pending/refunded, dueDate?, pdfUrl?, paymentStatus?, paymentId?} → invoices(id, appointment_id, doctor_id, patient_id, amount, currency, booked_on, status, due_date, pdf_url, payment_status, payment_id).
Payment (Areeba): {id, appointmentId?, invoiceId?, amount, currency, areebaTransactionId?, status pending/authorized/paid/failed/refunded, redirectUrl?, rawResponse?, paidAt?} → payments(id, appointment_id, invoice_id, amount, currency, areeba_transaction_id, status, redirect_url, raw_response_json, paid_at).
WalletTransaction: {id, patientId, accountNo, reason, transactionDate, amount, status, direction debit|credit} → wallet_transactions(id, patient_id, account_no, reason, transaction_date, amount, status, direction).
Vital: {id, patientId, dependentId?, bloodPressure, heartRate, glucoseLevel, bodyTemperature, bmi, spo2, weight?, fbcStatus?, recordedAt, recordedBy?} → vitals(id, patient_id, dependent_id, blood_pressure, heart_rate, glucose_level, body_temperature, bmi, spo2, weight, fbc_status, recorded_at, recorded_by).
ChatConversation: {id, doctorId, patientId, lastMessageAt, pinnedBy?, unreadDoctorCount, unreadPatientCount} → conversations(id, doctor_id, patient_id, last_message_at, pinned_by, unread_doctor, unread_patient).
ChatMessage: {id, conversationId, senderId, body, type text/audio/video/file/location, attachmentUrl?, sentAt, status, replyToId?, metadata json} → messages(id, conversation_id, sender_id, body, message_type, attachment_url, sent_at, status, reply_to_id, metadata_json).
SocialLink: {id, doctorId, platform, url} → social_links(id, doctor_id, platform, url).
Membership: {id, doctorId, title, description} → memberships(id, doctor_id, title, description).
Notification: {id, userId, type, message, dataJson, readAt} → notifications(id, user_id, type, message, data, read_at).
API and Angular wiring outline

Backend endpoints: auth (login/logout/me/register-patient/register-doctor), doctor search/profile/availabilities, patient appointments CRUD (create, list, cancel), doctor appointment management (filter, status change), favourites CRUD, dependents CRUD, medical-records/prescriptions CRUD, vitals CRUD, invoices list/view, wallet transactions, reviews list/create, chat conversations/messages, payments (POST /api/payments/areeba/create, callback), Twilio (GET /api/appointments/{id}/twilio-token).
Angular modules: SharedModule for Clindoctor components; AuthModule; PatientModule (routes /patient/… for dashboard, appointments, favourites, dependents, medical-records, accounts, invoices, chat, medical-details, profile-settings); DoctorModule (routes /doctor/… for dashboard, appointment-list/grid, available-timings, my-patients, doctor-specialities, reviews, invoices, chat-doctor, profile-settings, social-media, change-password); AdminModule for CRUD tables; lazy-load each.
Services: AuthService (Sanctum token), AppointmentService, DoctorService, PatientService, MedicalRecordService, DependentService, ReviewService, InvoiceService, PaymentService (Areeba), ChatService (conversations/messages, websockets later), VitalService. Interceptor attaches bearer token + handles 401/403.
Guards: AuthGuard + RoleGuard (patient/doctor/admin). Environment apiBaseUrl; CORS allow Angular origin.
Landing flow wiring: search form calls GET /api/doctors with specialty/city/name; doctor profile page pulls doctor details + reviews + availabilities; booking modal posts Appointment then Payment create -> redirect to Areeba; poll invoice/appointment status; if appointment_type=online and status confirmed/paid, call Twilio token endpoint to join room.
Next steps (suggested)

Generate Laravel migrations/models/resources/controllers per entities above (respect enums/relations), seed roles/users/doctor/patient/sample data.
Add Angular interfaces/services hooking these endpoints; refactor routing into auth/patient/doctor/admin modules and reuse existing templates with real data bindings.
Implement payment (Areeba) + Twilio service classes, wire appointment confirm/pay + online session tokens; connect dashboards/lists to API pagination/filters.
