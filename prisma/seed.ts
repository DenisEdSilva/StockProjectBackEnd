// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
    // Rotas de USER
    { action: 'GET', resource: 'USER', name: 'USER:GET' },
    { action: 'PUT', resource: 'USER', name: 'USER:PUT' },
    { action: 'DELETE', resource: 'USER', name: 'USER:DELETE' },

    // Rotas de STORE
    { action: 'POST', resource: 'STORE', name: 'STORE:POST' },
    { action: 'GET', resource: 'STORE', name: 'STORE:GET' },
    { action: 'PUT', resource: 'STORE', name: 'STORE:PUT' },
    { action: 'DELETE', resource: 'STORE', name: 'STORE:DELETE' },

    // Rotas de ROLE
    {action: 'POST', resource: 'ROLE', name: 'ROLE:POST'},
    {action: 'GET', resource: 'ROLE', name: 'ROLE:GET'},
    {action: 'PUT', resource: 'ROLE', name: 'ROLE:PUT'},
    {action: 'DELETE', resource: 'ROLE', name: 'ROLE:DELETE'},

    // Rotas de STORE_USER
    {action: 'POST', resource: 'STORE_USER', name: 'STORE_USER:POST'},
    {action: 'GET', resource: 'STORE_USER', name: 'STORE_USER:GET'},
    {action: 'PUT', resource: 'STORE_USER', name: 'STORE_USER:PUT'},
    {action: 'DELETE', resource: 'STORE_USER', name: 'STORE_USER:DELETE'},

    // Rotas de CATEGORY
    {action: 'POST', resource: 'CATEGORY', name: 'CATEGORY:POST'},
    {action: 'GET', resource: 'CATEGORY', name: 'CATEGORY:GET'},
    {action: 'PUT', resource: 'CATEGORY', name: 'CATEGORY:PUT'},
    {action: 'DELETE', resource: 'CATEGORY', name: 'CATEGORY:DELETE'},

    // Rotas de PRODUCT
    {action: 'POST', resource: 'PRODUCT', name: 'PRODUCT:POST'},
    {action: 'GET', resource: 'PRODUCT', name: 'PRODUCT:GET'},
    {action: 'PUT', resource: 'PRODUCT', name: 'PRODUCT:PUT'},
    {action: 'DELETE', resource: 'PRODUCT', name: 'PRODUCT:DELETE'},

    // Rotas de STOCK
    {action: 'POST', resource: 'STOCK', name: 'STOCK:POST'},
    {action: 'GET', resource: 'STOCK', name: 'STOCK:GET'},

    // Rota de AUDIT_LOG
    {action: 'GET', resource: 'AUDIT_LOG', name: 'AUDIT_LOG:GET'}

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