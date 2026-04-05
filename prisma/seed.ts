import { PrismaClient, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
		// Rotas de STORE
		{ action: PermissionAction.POST, resource: 'STORE', name: 'LOJA - CRIAR' },
		{ action: PermissionAction.GET, resource: 'STORE', name: 'LOJA - BUSCAR' },
		{ action: PermissionAction.PUT, resource: 'STORE', name: 'LOJA - VISUALIZAR' },
		{ action: PermissionAction.DELETE, resource: 'STORE', name: 'LOJA - DELETAR' },

		// Rotas de ROLE
		{action: PermissionAction.POST, resource: 'ROLE', name: 'CARGO - CRIAR'},
		{action: PermissionAction.GET, resource: 'ROLE', name: 'CARGO - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'ROLE', name: 'CARGO - VISUALIZAR'},
		{action: PermissionAction.DELETE, resource: 'ROLE', name: 'CARGO - DELETAR'},

		// Rotas de STORE_USER
		{action: PermissionAction.POST, resource: 'STORE_USER', name: 'USUÁRIO - CRIAR'},
		{action: PermissionAction.GET, resource: 'STORE_USER', name: 'USUÁRIO - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'STORE_USER', name: 'USUÁRIO - VISUALIZAR'},
		{action: PermissionAction.DELETE, resource: 'STORE_USER', name: 'USUÁRIO - DELETAR'},

		// Rotas de CATEGORY
		{action: PermissionAction.POST, resource: 'CATEGORY', name: 'CATEGORIA - CRIAR'},
		{action: PermissionAction.GET, resource: 'CATEGORY', name: 'CATEGORIA - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'CATEGORY', name: 'CATEGORIA - VISUALIZAR'},
		{action: PermissionAction.DELETE, resource: 'CATEGORY', name: 'CATEGORIA - DELETAR'},

		// Rotas de PRODUCT
		{action: PermissionAction.POST, resource: 'PRODUCT', name: 'PRODUTO - CRIAR'},
		{action: PermissionAction.GET, resource: 'PRODUCT', name: 'PRODUTO - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'PRODUCT', name: 'PRODUTO - VISUALIZAR'},
		{action: PermissionAction.DELETE, resource: 'PRODUCT', name: 'PRODUTO - DELETAR'},

		// Rotas de STOCK
		{action: PermissionAction.POST, resource: 'STOCK', name: 'MOVIMENTAÇÃO - CRIAR'},
		{action: PermissionAction.GET, resource: 'STOCK', name: 'MOVIMENTAÇÃO - BUSCAR'},
		{action: PermissionAction.PATCH, resource: 'STOCK', name: 'MOVIMENTAÇÃO - REVERTER'},

		// Rota de AUDIT_LOG
		{action: PermissionAction.GET, resource: 'AUDIT_LOG', name: 'REGISTRO - BUSCAR'},
];

async function main() {
		console.log('Iniciando seed de permissões... 🌱');
		for (const p of permissions) {
				await prisma.permission.upsert({
						where: { 
							action_resource: { 
								action: p.action, 
								resource: p.resource 
							} 
						},
						update: { 
							name: p.name 
						},
						create: p,
				});
		}

		console.log('Seed concluído com sucesso!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());