export interface VolunteerApplication {
    id: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    volunteerType: 'medical' | 'outreach' | 'education' | 'admin' | 'fundraising' | 'other';
    message: string;
    createdAt: string;
    lastModifiedAt: string;
}

export interface CreateVolunteerApplicationBody {
    full_name: string;
    email_address: string;
    phone_number: string;
    volunteer_type: 'medical' | 'outreach' | 'education' | 'admin' | 'fundraising' | 'other';
    message: string;
}
