-- Create medications reference table
CREATE TABLE IF NOT EXISTS medication_reference (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert medications into reference table
INSERT INTO medication_reference (id, category, name) VALUES 
(UUID(), 'ntds', 'Albendazole'),
(UUID(), 'ntds', 'Mebendazole'),
(UUID(), 'ntds', 'Praziquantel'),
(UUID(), 'ntds', 'Ivermectin'),
(UUID(), 'ntds', 'Levamisole'),
(UUID(), 'antibiotics', 'Amoxicillin'),
(UUID(), 'antibiotics', 'Ampiclox'),
(UUID(), 'antibiotics', 'Ciprofloxacillin'),
(UUID(), 'antibiotics', 'Co-trimoxazole tab'),
(UUID(), 'antibiotics', 'Erythromycin'),
(UUID(), 'antibiotics', 'Doxycycline'),
(UUID(), 'other', 'Paracetamol'),
(UUID(), 'other', 'Cetirizine'),
(UUID(), 'other', 'Dicflofenac gel'),
(UUID(), 'other', 'Artemether'),
(UUID(), 'other', 'Diclofenac tab'),
(UUID(), 'other', 'Clotrimazole cream'),
(UUID(), 'other', 'Griseofulvin tab'),
(UUID(), 'other', 'Ibuprofen tab'),
(UUID(), 'other', 'ALU tabs'),
(UUID(), 'other', 'Vitamin B complex'),
(UUID(), 'other', 'Skyderm cream'),
(UUID(), 'other', 'Ferrous'),
(UUID(), 'other', 'Piriton'),
(UUID(), 'other', 'Omeprazole'),
(UUID(), 'other', 'Salbutamol'),
(UUID(), 'other', 'Praziquantel'),
(UUID(), 'other', 'Salimia liniment'),
(UUID(), 'other', 'Cough mixture'),
(UUID(), 'other', 'Prednisolone'),
(UUID(), 'other', 'Dexan'),
(UUID(), 'other', 'Dexaneomycin eye & ear drop'),
(UUID(), 'other', 'Gentamycin eye & ear drop');

-- Create tests reference table
CREATE TABLE IF NOT EXISTS test_reference (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test types
INSERT INTO test_reference (id, category, name) VALUES 
(UUID(), 'type', 'H. Pylori (-)'),
(UUID(), 'type', 'H. Pylori (+)'),
(UUID(), 'type', 'Malaria (-)'),
(UUID(), 'type', 'Malaria (+)'),
(UUID(), 'type', 'HIV (-)'),
(UUID(), 'type', 'HIV (+)'),
(UUID(), 'type', 'Urinalysis (normal)'),
(UUID(), 'type', 'Urinalysis (abnormal)'),
(UUID(), 'type', 'Hb (normal)'),
(UUID(), 'type', 'Hb (abnormal)'),
(UUID(), 'type', 'VDRL (-)'),
(UUID(), 'type', 'VDRL (+)'),
(UUID(), 'type', 'Stool (normal)'),
(UUID(), 'type', 'Stool (helminthes)'),
(UUID(), 'type', 'Stool (amoebiasis)'),
(UUID(), 'type', 'Widal test (normal)'),
(UUID(), 'type', 'Widal test (abnormal)');

-- Insert test results
INSERT INTO test_reference (id, category, name) VALUES 
(UUID(), 'result', 'H. Pylori (-)'),
(UUID(), 'result', 'H. Pylori (+)'),
(UUID(), 'result', 'Malaria (-)'),
(UUID(), 'result', 'Malaria (+)'),
(UUID(), 'result', 'HIV (-)'),
(UUID(), 'result', 'HIV (+)'),
(UUID(), 'result', 'Urinalysis (normal)'),
(UUID(), 'result', 'Urinalysis (abnormal)'),
(UUID(), 'result', 'Hb (normal)'),
(UUID(), 'result', 'Hb (abnormal)'),
(UUID(), 'result', 'VDRL (-)'),
(UUID(), 'result', 'VDRL (+)'),
(UUID(), 'result', 'Stool (normal)'),
(UUID(), 'result', 'Stool (helminthes)'),
(UUID(), 'result', 'Stool (amoebiasis)'),
(UUID(), 'result', 'Widal test (normal)'),
(UUID(), 'result', 'Widal test (abnormal)');

-- Create procedures reference table
CREATE TABLE IF NOT EXISTS procedure_reference (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert procedures
INSERT INTO procedure_reference (id, name) VALUES 
(UUID(), 'Wound Dressing'),
(UUID(), 'Suturing'),
(UUID(), 'Incision and Drainage'),
(UUID(), 'Minor Surgery'),
(UUID(), 'Casting'),
(UUID(), 'Splinting'),
(UUID(), 'Catheterization'),
(UUID(), 'IV Cannulation'),
(UUID(), 'Blood Draw'),
(UUID(), 'Immunization'),
(UUID(), 'First Aid');
