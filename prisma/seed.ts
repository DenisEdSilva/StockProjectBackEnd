// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
    // Rotas de STORE
    { action: 'POST', resource: 'STORE', name: 'LOJA - CRIAR' },
    { action: 'GET', resource: 'STORE', name: 'LOJA - BUSCAR' },
    { action: 'PUT', resource: 'STORE', name: 'LOJA - VISUALIZAR' },
    { action: 'DELETE', resource: 'STORE', name: 'LOJA - DELETAR' },

    // Rotas de ROLE
    {action: 'POST', resource: 'ROLE', name: 'CARGO - CRIAR'},
    {action: 'GET', resource: 'ROLE', name: 'CARGO - BUSCAR'},
    {action: 'PUT', resource: 'ROLE', name: 'CARGO - VISUALIZAR'},
    {action: 'DELETE', resource: 'ROLE', name: 'CARGO - DELETAR'},

    // Rotas de STORE_USER
    {action: 'POST', resource: 'STORE_USER', name: 'USUÁRIO - CRIAR'},
    {action: 'GET', resource: 'STORE_USER', name: 'USUÁRIO - BUSCAR'},
    {action: 'PUT', resource: 'STORE_USER', name: 'USUÁRIO - VISUALIZAR'},
    {action: 'DELETE', resource: 'STORE_USER', name: 'USUÁRIO - DELETAR'},

    // Rotas de CATEGORY
    {action: 'POST', resource: 'CATEGORY', name: 'CATEGORIA - CRIAR'},
    {action: 'GET', resource: 'CATEGORY', name: 'CATEGORIA - BUSCAR'},
    {action: 'PUT', resource: 'CATEGORY', name: 'CATEGORIA - VISUALIZAR'},
    {action: 'DELETE', resource: 'CATEGORY', name: 'CATEGORIA - DELETAR'},

    // Rotas de PRODUCT
    {action: 'POST', resource: 'PRODUCT', name: 'PRODUTO - CRIAR'},
    {action: 'GET', resource: 'PRODUCT', name: 'PRODUTO - BUSCAR'},
    {action: 'PUT', resource: 'PRODUCT', name: 'PRODUTO - VISUALIZAR'},
    {action: 'DELETE', resource: 'PRODUCT', name: 'PRODUTO - DELETAR'},

    // Rotas de STOCK
    {action: 'POST', resource: 'STOCK', name: 'MOVIMENTAÇÃO - CRIAR'},
    {action: 'GET', resource: 'STOCK', name: 'MOVIMENTAÇÃO - BUSCAR'},
    {action: 'PATCH', resource: 'STOCK', name: 'MOVIMENTAÇÃO - REVERTER'},

    // Rota de AUDIT_LOG
    {action: 'GET', resource: 'AUDIT_LOG', name: 'REGISTRO - BUSCAR'},
];

async function main() {
  await prisma.permission.deleteMany();

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  console.log('Seed concluído! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });