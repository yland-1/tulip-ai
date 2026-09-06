import 'dotenv/config';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';

// Read the project ID directly from the JSON key to ensure it connects correctly
const keyData = JSON.parse(fs.readFileSync('./gcp-key.json', 'utf8'));
const bigquery = new BigQuery({ projectId: keyData.project_id });
const DATASET_ID = 'meta_ads_data';
const TABLE_ID = 'CampaignStats';

const mockData = [
  {
    account_id: 'act_123456789',
    campaign_id: 'meta-camp-001',
    campaign_name: 'Advantage+ Shopping Campaign (ASC) - US',
    daily_budget: 1000,
    status: 'ENABLED',
    spend: 6950,
    conversions: 198, // CPA = ~35.10
    roas: 2.85,
    date: new Date().toISOString().split('T')[0]
  },
  {
    account_id: 'act_123456789',
    campaign_id: 'meta-camp-002',
    campaign_name: 'Middle of Funnel - Retargeting Video',
    daily_budget: 500,
    status: 'ENABLED',
    spend: 3480,
    conversions: 51, // CPA = ~68.23
    roas: 1.45,
    date: new Date().toISOString().split('T')[0]
  },
  {
    account_id: 'act_123456789',
    campaign_id: 'meta-camp-003',
    campaign_name: 'Prospecting - Broad Match - EU',
    daily_budget: 300,
    status: 'ENABLED',
    spend: 2100,
    conversions: 84, // CPA = 25.00
    roas: 3.10,
    date: new Date().toISOString().split('T')[0]
  }
];

async function seedBigQuery() {
  try {
    console.log(`Checking if dataset ${DATASET_ID} exists...`);
    const [dataset] = await bigquery.dataset(DATASET_ID).get({ autoCreate: true });
    console.log(`Dataset ${dataset.id} is ready.`);

    const schema = [
      { name: 'account_id', type: 'STRING' },
      { name: 'campaign_id', type: 'STRING' },
      { name: 'campaign_name', type: 'STRING' },
      { name: 'daily_budget', type: 'NUMERIC' },
      { name: 'status', type: 'STRING' },
      { name: 'spend', type: 'NUMERIC' },
      { name: 'conversions', type: 'INT64' },
      { name: 'roas', type: 'NUMERIC' },
      { name: 'date', type: 'DATE' },
    ];

    console.log(`Checking if table ${TABLE_ID} exists...`);
    const table = dataset.table(TABLE_ID);
    const [exists] = await table.exists();
    
    if (!exists) {
      console.log(`Creating table ${TABLE_ID}...`);
      await dataset.createTable(TABLE_ID, { schema });
      console.log(`Table ${TABLE_ID} created.`);
    } else {
      console.log(`Table ${TABLE_ID} already exists.`);
    }

    console.log(`Inserting ${mockData.length} mock rows into BigQuery...`);
    await table.insert(mockData);
    console.log('✅ Successfully seeded BigQuery with mock Meta Ads data!');
    
  } catch (error) {
    console.error('❌ Failed to seed BigQuery:', error);
    console.error('\nNOTE: If you get a permission error, you need to go to IAM & Admin in GCP and grant your service account the "BigQuery Data Editor" role so it can create tables and insert data.');
  }
}

seedBigQuery();
