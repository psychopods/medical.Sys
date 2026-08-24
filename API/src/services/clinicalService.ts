import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';

// 1. BASELINE INFO
export async function saveBaseline(
    pool: Pool,
    id: string,
    childId: string,
    visitDate: string,
    firstVisit: boolean,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO medical_baselines 
        (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, 1, 'synced')
        ON DUPLICATE KEY UPDATE 
        visit_date = VALUES(visit_date),
        first_visit = VALUES(first_visit),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1`,
        [id, childId, visitDate, firstVisit ? 1 : 0, recordedBy, recordedByName]
    );
    return { id, childId, visitDate, firstVisit };
}

export async function getBaseline(pool: Pool, childId: string): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM medical_baselines WHERE child_id = ? ORDER BY visit_date DESC LIMIT 1`,
        [childId]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        id: row.id,
        childId: row.child_id,
        visitDate: row.visit_date,
        firstVisit: row.first_visit === 1,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    };
}

// 2. VITALS
export async function saveVitals(
    pool: Pool,
    id: string,
    childId: string,
    weight: number | null,
    height: number | null,
    bmi: number | null,
    bmiStatus: string | null,
    recordedBy: string | null,
    recordedByName: string | null,
    date: string
): Promise<any> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO child_vitals 
        (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')
        ON DUPLICATE KEY UPDATE 
        weight = VALUES(weight),
        height = VALUES(height),
        bmi = VALUES(bmi),
        bmi_status = VALUES(bmi_status),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        date = VALUES(date),
        version = version + 1`,
        [id, childId, weight, height, bmi, bmiStatus, recordedBy, recordedByName, date]
    );
    return { id, childId, weight, height, bmi, bmiStatus, date };
}

export async function getVitalsHistory(pool: Pool, childId: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM child_vitals WHERE child_id = ? ORDER BY date DESC, created_at DESC`,
        [childId]
    );
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        weight: row.weight !== null ? Number(row.weight) : null,
        height: row.height !== null ? Number(row.height) : null,
        bmi: row.bmi !== null ? Number(row.bmi) : null,
        bmiStatus: row.bmi_status,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        date: row.date,
        createdAt: row.created_at
    }));
}

// 3. MEDICATIONS
export async function saveMedication(
    pool: Pool,
    id: string,
    childId: string,
    ntdsMeds: string | null,
    antibiotics: string | null,
    otherMeds: string | null,
    dateGiven: string,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    await pool.execute<ResultSetHeader>(
        `INSERT INTO medications_given 
        (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')
        ON DUPLICATE KEY UPDATE 
        ntds_meds = VALUES(ntds_meds),
        antibiotics = VALUES(antibiotics),
        other_meds = VALUES(other_meds),
        date_given = VALUES(date_given),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1`,
        [id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven, recordedBy, recordedByName]
    );
    return { id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven };
}

export async function getMedicationsHistory(pool: Pool, childId: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM medications_given WHERE child_id = ? ORDER BY date_given DESC, created_at DESC`,
        [childId]
    );
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        ntdsMeds: row.ntds_meds,
        antibiotics: row.antibiotics,
        otherMeds: row.other_meds,
        dateGiven: row.date_given,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    }));
}

// 4. LABORATORY TESTS
export async function saveTest(
    pool: Pool,
    id: string,
    childId: string,
    testType: string,
    result: string,
    date: string,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    await pool.execute<ResultSetHeader>(
        `INSERT INTO laboratory_tests 
        (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')
        ON DUPLICATE KEY UPDATE 
        test_type = VALUES(test_type),
        result = VALUES(result),
        date = VALUES(date),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1`,
        [id, childId, testType, result, date, recordedBy, recordedByName]
    );
    return { id, childId, testType, result, date };
}

export async function getTestsHistory(pool: Pool, childId: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM laboratory_tests WHERE child_id = ? ORDER BY date DESC, created_at DESC`,
        [childId]
    );
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        testType: row.test_type,
        result: row.result,
        date: row.date,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    }));
}

// 5. SERVICES RENDERED - FIXED!
export async function saveService(
    pool: Pool,
    id: string,
    childId: string,
    serviceType: 'medical' | 'social' | 'education',
    servicesList: string,
    date: string,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    await pool.execute<ResultSetHeader>(
        `INSERT INTO services_rendered 
        (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        service_type = VALUES(service_type),
        services_list = VALUES(services_list),
        date = VALUES(date),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1,
        sync_status = 'synced'`,
        [
            id,                    // 1. id
            childId,               // 2. child_id
            serviceType,           // 3. service_type
            servicesList,          // 4. services_list
            date,                  // 5. date
            recordedBy || null,    // 6. recorded_by
            recordedByName || null, // 7. recorded_by_name
            1,                     // 8. version ← FIXED: Added this
            'synced'               // 9. sync_status ← FIXED: Added this
        ]
    );
    return { id, childId, serviceType, servicesList, date };
}

export async function getServicesHistory(pool: Pool, childId: string, serviceType?: string): Promise<any[]> {
    let query = `SELECT * FROM services_rendered WHERE child_id = ?`;
    const params: any[] = [childId];
    if (serviceType) {
        query += ` AND service_type = ?`;
        params.push(serviceType);
    }
    query += ` ORDER BY date DESC, created_at DESC`;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        serviceType: row.service_type,
        servicesList: row.services_list,
        servicesProvided: row.services_list ? row.services_list.split(',').map((s: string) => s.trim()) : [],
        date: row.date,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    }));
}

// 6. SYMPTOMS RECORDED
export async function saveSymptoms(
    pool: Pool,
    id: string,
    childId: string,
    symptoms: string | null,
    visitNotes: string | null,
    date: string,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    // Validate child exists
    const [childCheck] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE id = ? LIMIT 1',
        [childId]
    );
    if (childCheck.length === 0) {
        throw new HttpError(404, `Child with ID '${childId}' not found.`);
    }

    await pool.execute<ResultSetHeader>(
        `INSERT INTO symptoms_recorded 
        (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        symptoms = VALUES(symptoms),
        visit_notes = VALUES(visit_notes),
        date = VALUES(date),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1`,
        [
            id,                    // 1. id
            childId,               // 2. child_id
            symptoms || '',        // 3. symptoms
            visitNotes || '',      // 4. visit_notes
            date,                  // 5. date
            recordedBy || null,    // 6. recorded_by
            recordedByName || 'System', // 7. recorded_by_name
            1,                     // 8. version
            'synced'               // 9. sync_status
        ]
    );
    return { id, childId, symptoms, visitNotes, date };
}

export async function getSymptomsHistory(pool: Pool, childId: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM symptoms_recorded WHERE child_id = ? ORDER BY date DESC, created_at DESC`,
        [childId]
    );
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        symptoms: row.symptoms,
        visitNotes: row.visit_notes,
        date: row.date,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    }));
}

// 7. CLOTHING PROVISIONS - FIXED!
export async function saveClothing(
    pool: Pool,
    id: string,
    childId: string,
    shoes: string | null,
    clothes: string | null,
    date: string,
    recordedBy: string | null,
    recordedByName: string | null
): Promise<any> {
    await pool.execute<ResultSetHeader>(
        `INSERT INTO clothing_provisions 
        (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, sync_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        shoes = VALUES(shoes),
        clothes = VALUES(clothes),
        date = VALUES(date),
        recorded_by = VALUES(recorded_by),
        recorded_by_name = VALUES(recorded_by_name),
        version = version + 1,
        sync_status = 'synced'`,
        [
            id,                    // 1. id
            childId,               // 2. child_id
            shoes || '',           // 3. shoes
            clothes || '',         // 4. clothes
            date,                  // 5. date
            recordedBy || null,    // 6. recorded_by
            recordedByName || null, // 7. recorded_by_name
            1,                     // 8. version ← FIXED: Added this
            'synced'               // 9. sync_status ← FIXED: Added this
        ]
    );
    return { id, childId, shoes, clothes, date };
}

export async function getClothingHistory(pool: Pool, childId: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM clothing_provisions WHERE child_id = ? ORDER BY date DESC, created_at DESC`,
        [childId]
    );
    return rows.map(row => ({
        id: row.id,
        childId: row.child_id,
        shoes: row.shoes,
        clothes: row.clothes,
        date: row.date,
        recordedBy: row.recorded_by,
        recordedByName: row.recorded_by_name,
        createdAt: row.created_at
    }));
}

// 8. CLINICAL OPTIONS
export async function getClinicalOptions(pool: Pool): Promise<any> {
    try {
        // 1. Get medications from lookup_medications table
        const [medsRows] = await pool.execute<RowDataPacket[]>(
            'SELECT name, category FROM lookup_medications ORDER BY category, name'
        );
        
        const medicationOptions: Record<string, string[]> = {
            ntdsMeds: [],
            antibiotics: [],
            otherMeds: []
        };

        medsRows.forEach((row) => {
            const cat = row.category;
            if (medicationOptions[cat] !== undefined) {
                medicationOptions[cat].push(row.name);
            } else {
                medicationOptions[cat] = [row.name];
            }
        });

        // 2. Get test types from test_reference table
        let testTypes: string[] = [];
        let testResults: string[] = [];
        
        try {
            const [testTypesRows] = await pool.execute<RowDataPacket[]>(
                "SELECT name FROM test_reference WHERE category = 'testType' ORDER BY name"
            );
            testTypes = testTypesRows.map(row => row.name);
        } catch (error) {
            console.warn('Could not fetch test types, using defaults:', error);
        }

        try {
            const [testResultsRows] = await pool.execute<RowDataPacket[]>(
                "SELECT name FROM test_reference WHERE category = 'testResult' ORDER BY name"
            );
            testResults = testResultsRows.map(row => row.name);
        } catch (error) {
            console.warn('Could not fetch test results, using defaults:', error);
        }

        // Default test types and results if none found
        const defaultTestTypes = [
            "Haemoglobin test (Hb)",
            "Erythrocyte sedimentation rate (ESR)",
            "Blood glucose",
            "Uric acid test",
            "H. Pylori test",
            "Malaria test",
            "HIV test",
            "Urinalysis",
            "VDRL test",
            "Stool test",
            "Widal test"
        ];

        const defaultTestResults = [
            "Negative (-)",
            "Positive (+)",
            "Leukocyte +",
            "Leukocyte ++",
            "Leukocyte +++",
            "Glucose +",
            "Glucose ++",
            "Glucose +++",
            "Schistosoma ova seen",
            "High",
            "Low",
            "Normal",
            "Abnormal"
        ];

        // 3. Get procedures from procedure_reference table
        let procedures: string[] = [];
        try {
            const [proceduresRows] = await pool.execute<RowDataPacket[]>(
                'SELECT name FROM procedure_reference ORDER BY name'
            );
            procedures = proceduresRows.map(row => row.name);
        } catch (error) {
            console.warn('Could not fetch procedures, using empty array:', error);
        }

        // 4. Get education options from lookup_education table
        let education: string[] = [];
        try {
            const [educationRows] = await pool.execute<RowDataPacket[]>(
                'SELECT name FROM lookup_education ORDER BY name'
            );
            education = educationRows.map(row => row.name);
        } catch (error) {
            console.warn('Could not fetch education options, using defaults:', error);
        }

        const defaultEducation = [
            "Hygiene Education",
            "Nutrition Education",
            "Disease Prevention",
            "First Aid Training",
            "Health Awareness"
        ];

        // Return the options
        return {
            medicationOptions,
            testTypesOptions: testTypes.length > 0 ? testTypes : defaultTestTypes,
            testResultOptions: testResults.length > 0 ? testResults : defaultTestResults,
            procedureOptions: procedures,
            educationOptions: education.length > 0 ? education : defaultEducation
        };
    } catch (error) {
        console.error('Error fetching clinical options from MySQL:', error);
        // Return default values if query fails
        return {
            medicationOptions: { ntdsMeds: [], antibiotics: [], otherMeds: [] },
            testTypesOptions: [
                "Haemoglobin test (Hb)",
                "Erythrocyte sedimentation rate (ESR)",
                "Blood glucose",
                "Uric acid test",
                "H. Pylori test",
                "Malaria test",
                "HIV test",
                "Urinalysis",
                "VDRL test",
                "Stool test",
                "Widal test"
            ],
            testResultOptions: [
                "Negative (-)",
                "Positive (+)",
                "Leukocyte +",
                "Leukocyte ++",
                "Leukocyte +++",
                "Glucose +",
                "Glucose ++",
                "Glucose +++",
                "Schistosoma ova seen",
                "High",
                "Low",
                "Normal",
                "Abnormal"
            ],
            procedureOptions: [],
            educationOptions: [
                "Hygiene Education",
                "Nutrition Education",
                "Disease Prevention",
                "First Aid Training",
                "Health Awareness"
            ]
        };
    }
}