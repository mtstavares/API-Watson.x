# 🚀 API Watson.x

## 📖 Sobre o projeto  

Este é um projeto **fullstack em desenvolvimento**, com foco **educacional** e **experimental**, que implementa um **CRUD em arquivo JSON** através de uma **API REST em Node.js** e integra a **IA IBM Watsonx** para interpretar comandos em **linguagem natural**.  

Além do aprendizado técnico, o projeto também busca validar ideias que poderão futuramente ser aplicadas em **ambientes de produção da Polícia Militar do Estado de São Paulo**, explorando o uso de inteligência artificial para **otimizar processos internos** e abrindo espaço para a criação de um **agente de IA próprio** no futuro.

## ✨ Funcionalidades atuais
- 📂 **CRUD completo** (Create, Read, Update, Delete) sobre funcionários simulados em `db/data.json`.
- 🧠 **Integração com IA Watsonx**: permite consultas e alterações usando frases em português natural.
- 🛡️ **Documentação interativa** com Swagger em `/docs`.
- 🏗️ **Arquitetura MVC** simples e didática (Models, Views, Controllers).
- ⚙️ **Configuração via `.env`** (apikey, URL do Watsonx, project id).
- 🖥️ **Execução local** com `nodemon`.

## 🔧 Tecnologias usadas
![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)  
![Express](https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express)  
![Swagger](https://img.shields.io/badge/Swagger-API--Docs-brightgreen?logo=swagger)  
![IBM Watsonx](https://img.shields.io/badge/IBM-Watsonx-blue?logo=ibm)  
![License](https://img.shields.io/badge/License-MIT-yellow)  
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange)


## 🚧 Próximos passos

- **🖥️ Frontend em React** para interagir com a API e a IA via formulário/chat.

- **🔒 Validações e segurança** (autenticação de usuários, roles).

- **📊 Logs e auditoria** para cada requisição.

- **🧩 Expansão de intents da IA**: criação por prompt, relatórios automáticos e estatísticas.

- **☁️ Deploy em nuvem** (possível uso de Docker + IBM Cloud).
