const AWS = require('aws-sdk');

// Configuração do DynamoDB local
const documentClient = new AWS.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:8000',
    region: 'local',
    accessKeyId: 'local',
    secretAccessKey: 'local'
});

async function clearTables() {
    console.log('Limpando tabelas...');
    
    // Limpar tabela de ações
    const actions = await documentClient.scan({
        TableName: 'Actions'
    }).promise();
    
    for (const action of actions.Items) {
        await documentClient.delete({
            TableName: 'Actions',
            Key: { id: action.id }
        }).promise();
    }

    // Limpar tabela de usuários
    const users = await documentClient.scan({
        TableName: 'Users'
    }).promise();
    
    for (const user of users.Items) {
        await documentClient.delete({
            TableName: 'Users',
            Key: { id: user.id }
        }).promise();
    }

    console.log('Tabelas limpas com sucesso!');
}

async function createTestUser() {
    console.log('Criando usuário de teste...');
    await documentClient.put({
        TableName: 'Users',
        Item: {
            id: '209247519',
            username: 'EmanuelOzorio',
            ativo: true
        }
    }).promise();
    console.log('Usuário criado com sucesso!');
}

async function createTestAction() {
    console.log('Criando ação de teste...');
    await documentClient.put({
        TableName: 'Actions',
        Item: {
            id: `add-${Date.now()}`,
            type: 'ADD_PRODUCT',
            user_id: '209247519',
            product_link: 'https://www.amazon.com.br/dp/B08PP8QHFQ',
            created_at: new Date().toISOString(),
            is_processed: false
        }
    }).promise();
    console.log('Ação criada com sucesso!');
}

async function checkActions() {
    console.log('Verificando ações...');
    const result = await documentClient.scan({
        TableName: 'Actions'
    }).promise();
    console.log('Ações encontradas:', JSON.stringify(result.Items, null, 2));
}

async function runTest() {
    try {
        // Limpar dados antigos
        await clearTables();

        // Criar usuário e ação
        await createTestUser();
        await createTestAction();

        console.log('\nAgora você pode executar: npm run dev');
        console.log('Aguarde o processamento das ações e pressione Ctrl+C');
        console.log('Depois execute este script novamente para verificar o estado das ações\n');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

// Se há argumentos, apenas verifica as ações
if (process.argv.includes('--check')) {
    checkActions();
} else {
    runTest();
}