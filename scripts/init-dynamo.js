const AWS = require('aws-sdk');

// Configuração do DynamoDB local
const dynamodb = new AWS.DynamoDB({
    endpoint: 'http://localhost:8000',
    region: 'local',
    accessKeyId: 'local',
    secretAccessKey: 'local'
});

// Definições das tabelas
const tables = [
    {
        TableName: 'Users',
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'username', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UsernameIndex',
                KeySchema: [
                    { AttributeName: 'username', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Products',
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'link', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'LinkIndex',
                KeySchema: [
                    { AttributeName: 'link', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'Actions',
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'type', AttributeType: 'S' },
            { AttributeName: 'created_at', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'TypeCreatedIndex',
                KeySchema: [
                    { AttributeName: 'type', KeyType: 'HASH' },
                    { AttributeName: 'created_at', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'ActionConfigs',
        AttributeDefinitions: [
            { AttributeName: 'action_type', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'action_type', KeyType: 'HASH' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    }
];

// Função para criar uma tabela
async function createTable(params) {
    try {
        await dynamodb.createTable(params).promise();
        console.log(`Tabela ${params.TableName} criada com sucesso!`);
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log(`Tabela ${params.TableName} já existe.`);
        } else {
            console.error(`Erro ao criar tabela ${params.TableName}:`, error);
        }
    }
}

// Criar todas as tabelas
async function createTables() {
    for (const tableParams of tables) {
        await createTable(tableParams);
    }
}

// Função para inserir as configurações padrão de ações
async function insertDefaultActionConfigs() {
    const defaultConfigs = [
        {
            action_type: 'ADD_PRODUCT',
            interval_minutes: 1,
            enabled: true
        },
        {
            action_type: 'CHECK_PRODUCT',
            interval_minutes: 60,
            enabled: true
        },
        {
            action_type: 'NOTIFY_PRICE',
            interval_minutes: 1,
            enabled: true
        }
    ];

    for (const config of defaultConfigs) {
        try {
            await dynamodb.putItem({
                TableName: 'ActionConfigs',
                Item: AWS.DynamoDB.Converter.marshall(config)
            }).promise();
            console.log(`Configuração para ${config.action_type} inserida com sucesso!`);
        } catch (error) {
            console.error(`Erro ao inserir configuração para ${config.action_type}:`, error);
        }
    }
}

// Executar a criação das tabelas e inserir configurações
async function init() {
    await createTables();
    await insertDefaultActionConfigs();
}

init();