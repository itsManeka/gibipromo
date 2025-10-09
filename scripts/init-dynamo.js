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
			{ AttributeName: 'telegram_id', AttributeType: 'S' },
			{ AttributeName: 'username', AttributeType: 'S' },
			{ AttributeName: 'email', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'TelegramIdIndex',
				KeySchema: [
					{ AttributeName: 'telegram_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			},
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
			},
			{
				IndexName: 'EmailIndex',
				KeySchema: [
					{ AttributeName: 'email', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	},
	{
		TableName: 'Products',
		AttributeDefinitions: [
			{ AttributeName: 'id', AttributeType: 'S' },
			{ AttributeName: 'url', AttributeType: 'S' },
			{ AttributeName: 'offer_id', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'UrlIndex',
				KeySchema: [
					{ AttributeName: 'url', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			},
			{
				IndexName: 'OfferIndex',
				KeySchema: [
					{ AttributeName: 'offer_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
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
			{ AttributeName: 'created_at', AttributeType: 'S' },
			{ AttributeName: 'is_processed', AttributeType: 'N' }
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
			},
			{
				IndexName: 'TypeProcessedIndex',
				KeySchema: [
					{ AttributeName: 'type', KeyType: 'HASH' },
					{ AttributeName: 'is_processed', KeyType: 'RANGE' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	},
	{
		TableName: 'ProductUsers',
		AttributeDefinitions: [
			{ AttributeName: 'product_id', AttributeType: 'S' },
			{ AttributeName: 'user_id', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'product_id', KeyType: 'HASH' },
			{ AttributeName: 'user_id', KeyType: 'RANGE' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'UserIdIndex',
				KeySchema: [
					{ AttributeName: 'user_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
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
	},
	{
		TableName: 'ProductStats',
		AttributeDefinitions: [
			{ AttributeName: 'id', AttributeType: 'S' },
			{ AttributeName: 'product_id', AttributeType: 'S' },
			{ AttributeName: 'created_at', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'ProductStatsIndex',
				KeySchema: [
					{ AttributeName: 'product_id', KeyType: 'HASH' },
					{ AttributeName: 'created_at', KeyType: 'RANGE' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	},
	{
		TableName: 'Session',
		AttributeDefinitions: [
			{ AttributeName: 'session_id', AttributeType: 'S' },
			{ AttributeName: 'user_id', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'session_id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'UserIdIndex',
				KeySchema: [
					{ AttributeName: 'user_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	},
	{
		TableName: 'UserPreferences',
		AttributeDefinitions: [
			{ AttributeName: 'id', AttributeType: 'S' },
			{ AttributeName: 'user_id', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'UserIdIndex',
				KeySchema: [
					{ AttributeName: 'user_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
		ProvisionedThroughput: {
			ReadCapacityUnits: 5,
			WriteCapacityUnits: 5
		}
	},
	{
		TableName: 'UserProfile',
		AttributeDefinitions: [
			{ AttributeName: 'id', AttributeType: 'S' },
			{ AttributeName: 'user_id', AttributeType: 'S' }
		],
		KeySchema: [
			{ AttributeName: 'id', KeyType: 'HASH' }
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: 'UserIdIndex',
				KeySchema: [
					{ AttributeName: 'user_id', KeyType: 'HASH' }
				],
				Projection: { ProjectionType: 'ALL' },
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5
				}
			}
		],
		BillingMode: 'PROVISIONED',
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
			id: 'ADD_PRODUCT',
			action_type: 'ADD_PRODUCT',
			interval_minutes: 1,
			enabled: true
		},
		{
			id: 'CHECK_PRODUCT',
			action_type: 'CHECK_PRODUCT',
			interval_minutes: 60,
			enabled: true
		},
		{
			id: 'NOTIFY_PRICE',
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

// Limpa e recria uma tabela
async function recreateTable(params) {
	try {
		// Tenta deletar a tabela existente
		await dynamodb.deleteTable({ TableName: params.TableName }).promise();
		console.log(`Tabela ${params.TableName} removida.`);
	} catch (error) {
		if (error.code !== 'ResourceNotFoundException') {
			console.error(`Erro ao deletar tabela ${params.TableName}:`, error);
		}
	}

	// Espera 2 segundos para garantir que a tabela foi deletada
	await new Promise(resolve => setTimeout(resolve, 2000));

	// Cria a tabela novamente
	await createTable(params);
}

// Executar a criação das tabelas e inserir configurações
async function init() {
	// Utiliza o parâmetro --reset para limpar e recriar as tabelas
	const args = process.argv.slice(2);
	const reset = args.includes('--reset');

	if (reset) {
		console.log('Recriando tabelas...');
		for (const tableParams of tables) {
			await recreateTable(tableParams);

		}
	} else {
		console.log('Criando tabelas se não existirem...');
		await createTables();
	}

	console.log('Inserindo configurações padrão...');
	await insertDefaultActionConfigs();
	console.log('Setup concluído!');
}

init();