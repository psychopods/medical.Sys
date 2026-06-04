export interface ContactSubmission {
    id: string;
    fullName: string;
    emailAddress: string;
    messageSubject: string;
    messageContent: string;
    createdAt: string;
    lastModifiedAt: string;
}

export interface CreateContactSubmissionBody {
    full_name: string;
    email_address: string;
    message_subject: string;
    message_content: string;
}
