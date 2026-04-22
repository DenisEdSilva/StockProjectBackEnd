import { PrismaClient, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
		// Rotas de STORE
		{ action: PermissionAction.POST, resource: 'STORE', name: 'LOJA - CRIAR' },
		{ action: PermissionAction.GET, resource: 'STORE', name: 'LOJA - BUSCAR' },
		{ action: PermissionAction.PUT, resource: 'STORE', name: 'LOJA - EDITAR' },
		{ action: PermissionAction.DELETE, resource: 'STORE', name: 'LOJA - DELETAR' },

		// Rotas de ROLE
		{action: PermissionAction.POST, resource: 'ROLE', name: 'CARGO - CRIAR'},
		{action: PermissionAction.GET, resource: 'ROLE', name: 'CARGO - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'ROLE', name: 'CARGO - EDITAR'},
		{action: PermissionAction.DELETE, resource: 'ROLE', name: 'CARGO - DELETAR'},

		// Rotas de STORE_USER
		{action: PermissionAction.POST, resource: 'STORE_USER', name: 'USUÁRIO - CRIAR'},
		{action: PermissionAction.GET, resource: 'STORE_USER', name: 'USUÁRIO - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'STORE_USER', name: 'USUÁRIO - EDITAR'},
		{action: PermissionAction.DELETE, resource: 'STORE_USER', name: 'USUÁRIO - DELETAR'},

		// Rotas de CATEGORY
		{action: PermissionAction.POST, resource: 'CATEGORY', name: 'CATEGORIA - CRIAR'},
		{action: PermissionAction.GET, resource: 'CATEGORY', name: 'CATEGORIA - BUSCAR'},
		{action: PermissionAction.PUT, resource: 'CATEGORY', name: 'CATEGORIA - EDITAR'},
		{action: PermissionAction.DELETE, resource: 'CATEGORY', name: 'CATEGORIA - DELETAR'},

		// PERMISSÕES DA MATRIZ
		{action: PermissionAction.POST, resource: 'CATALOG', name: 'CATÁLOGO - CRIAR PRODUTO'},
		{action: PermissionAction.PUT,  resource: 'CATALOG', name: 'CATÁLOGO - EDITAR DADOS GLOBAIS'},
		{action: PermissionAction.DELETE, resource: 'CATALOG', name: 'CATÁLOGO - DELETAR GLOBAL'},

		// PERMISSÕES DA LOJA
		{action: PermissionAction.POST, resource: 'INVENTORY', name: 'ESTOQUE - ADICIONAR PRODUTO NA LOJA'},
		{action: PermissionAction.PUT,  resource: 'INVENTORY', name: 'ESTOQUE - EDITAR PREÇO/QUANTIDADE'},
		{action: PermissionAction.GET,  resource: 'INVENTORY', name: 'ESTOQUE - VISUALIZAR'},
		{action: PermissionAction.DELETE, resource: 'INVENTORY', name: 'ESTOQUE - REMOVER DA LOJA'},

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