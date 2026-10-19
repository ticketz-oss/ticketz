# Espaço Whats

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipes que operam conversas e atendimentos e clientes que avaliam integrações com seus próprios sistemas. Neste trabalho, o usuário confirmou uma visão completa dos recursos existentes, com envio de mensagens em destaque.

## Product Purpose

Centralizar conversas, contatos e atendimento. A documentação pública deve ajudar um cliente a entender o que existe e como cada credencial e fluxo funciona.

## Capabilities and Constraints

Frontend React 17 e backend Express/TypeScript. A referência deriva das rotas montadas e dos controladores. Documentar não cria endpoints, não ativa módulos e não amplia permissões. MCP futuro é uma iniciativa separada; rotas MCP/OAuth já presentes são descritas como estado atual.

## Brand Commitments

Preservar a identidade Espaço Whats e aproveitar os conceitos visuais da landing page existente. O usuário pediu uma documentação organizada, simples de explorar e que vá além de texto corrido.

## Evidence on Hand

- `frontend/src/pages/LandingPage`: identidade e componentes da apresentação pública.
- `backend/src/routes` e `backend/src/controllers`: operações e regras observáveis.
- `docs/production-upgrades.md`: processo de publicação e preservação de dados.

## Product Principles

- Documentar capacidades comprovadas na implementação.
- Distinguir sessão do usuário, integração de contatos e acesso administrativo.
- Manter exemplos fictícios identificados e credenciais fora da página pública.
- Preservar o acesso ao código-fonte AGPL.
