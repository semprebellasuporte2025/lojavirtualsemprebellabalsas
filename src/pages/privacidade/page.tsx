
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';

export default function PrivacidadePage() {
  return (
    <>
      <SEOHead
        title="Política de Privacidade - Sempre Bella Balsas"
        description="Conheça nossa política de privacidade e como protegemos seus dados pessoais na Sempre Bella Balsas."
        keywords="política de privacidade, proteção de dados, lgpd, sempre bella balsas"
      />
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Política de Privacidade
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Sua privacidade é fundamental para nós. Conheça como coletamos, 
                utilizamos e protegemos suas informações pessoais.
              </p>
            </div>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              
              {/* Última Atualização */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
                <div className="flex items-center mb-3">
                  <i className="ri-information-fill text-blue-600 text-xl mr-3"></i>
                  <h2 className="text-lg font-semibold text-blue-800">Informações Importantes</h2>
                </div>
                <p className="text-blue-700 mb-2">
                  <strong>Última atualização:</strong> 15 de dezembro de 2024
                </p>
                <p className="text-blue-700">
                  Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018.
                </p>
              </div>

              {/* 1. Informações Gerais */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">1. Informações Gerais</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    A Sempre Bella Balsas, pessoa jurídica de direito privado, com sede em Balsas - MA, 
                    inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, doravante denominada "Sempre Bella", 
                    é a responsável pelo tratamento dos dados pessoais coletados através de nosso site e loja física.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Esta Política de Privacidade tem por objetivo esclarecer como coletamos, utilizamos, 
                    armazenamos e protegemos os dados pessoais de nossos clientes, visitantes e usuários.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Ao utilizar nossos serviços, você concorda com os termos desta política. 
                    Recomendamos a leitura atenta deste documento.
                  </p>
                </div>
              </div>

              {/* 2. Dados Coletados */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">2. Dados Pessoais Coletados</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-user-fill text-pink-600 mr-3"></i>
                      Dados de Identificação
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Nome completo</li>
                      <li>• CPF</li>
                      <li>• Data de nascimento</li>
                      <li>• Gênero</li>
                      <li>• Estado civil</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-phone-fill text-blue-600 mr-3"></i>
                      Dados de Contato
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• E-mail</li>
                      <li>• Telefone/Celular</li>
                      <li>• Endereço completo</li>
                      <li>• CEP</li>
                      <li>• Cidade e Estado</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-shopping-cart-fill text-green-600 mr-3"></i>
                      Dados de Compra
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Histórico de pedidos</li>
                      <li>• Produtos adquiridos</li>
                      <li>• Formas de pagamento</li>
                      <li>• Preferências de entrega</li>
                      <li>• Avaliações e comentários</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-computer-fill text-purple-600 mr-3"></i>
                      Dados de Navegação
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Endereço IP</li>
                      <li>• Tipo de navegador</li>
                      <li>• Páginas visitadas</li>
                      <li>• Tempo de permanência</li>
                      <li>• Cookies e tecnologias similares</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. Finalidades */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">3. Finalidades do Tratamento</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-pink-500 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Execução de Contratos</h3>
                    <p className="text-gray-600">
                      Processamento de pedidos, entrega de produtos, cobrança, atendimento ao cliente 
                      e cumprimento de obrigações contratuais.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Comunicação</h3>
                    <p className="text-gray-600">
                      Envio de informações sobre pedidos, promoções, novidades, pesquisas de satisfação 
                      e comunicações relacionadas aos nossos serviços.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Melhoria dos Serviços</h3>
                    <p className="text-gray-600">
                      Análise de comportamento de compra, personalização da experiência, 
                      desenvolvimento de novos produtos e aprimoramento do atendimento.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Cumprimento Legal</h3>
                    <p className="text-gray-600">
                      Atendimento a obrigações legais, regulamentares, fiscais e trabalhistas, 
                      bem como determinações de autoridades competentes.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Compartilhamento */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">4. Compartilhamento de Dados</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start">
                    <i className="ri-alert-fill text-yellow-600 text-xl mr-3 mt-1"></i>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Importante</h3>
                      <p className="text-yellow-700">
                        Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros 
                        para fins comerciais sem seu consentimento expresso.
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Seus dados podem ser compartilhados apenas nas seguintes situações:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <i className="ri-truck-fill text-blue-600 text-xl mr-3 mt-1"></i>
                    <div>
                      <h4 className="font-semibold text-gray-800">Empresas de Logística</h4>
                      <p className="text-gray-600">Para entrega dos produtos adquiridos.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <i className="ri-bank-card-fill text-green-600 text-xl mr-3 mt-1"></i>
                    <div>
                      <h4 className="font-semibold text-gray-800">Processadores de Pagamento</h4>
                      <p className="text-gray-600">Para processamento de transações financeiras.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <i className="ri-government-fill text-purple-600 text-xl mr-3 mt-1"></i>
                    <div>
                      <h4 className="font-semibold text-gray-800">Autoridades Competentes</h4>
                      <p className="text-gray-600">Quando exigido por lei ou ordem judicial.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <i className="ri-service-fill text-orange-600 text-xl mr-3 mt-1"></i>
                    <div>
                      <h4 className="font-semibold text-gray-800">Prestadores de Serviços</h4>
                      <p className="text-gray-600">Empresas que nos auxiliam na operação do negócio (sempre com contratos de confidencialidade).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Segurança */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">5. Segurança dos Dados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-shield-check-fill text-green-600 mr-3"></i>
                      Medidas Técnicas
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Criptografia SSL/TLS</li>
                      <li>• Firewalls e antivírus</li>
                      <li>• Backup regular dos dados</li>
                      <li>• Monitoramento 24/7</li>
                      <li>• Controle de acesso</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <i className="ri-team-fill text-blue-600 mr-3"></i>
                      Medidas Organizacionais
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Treinamento da equipe</li>
                      <li>• Políticas internas de segurança</li>
                      <li>• Contratos de confidencialidade</li>
                      <li>• Auditoria regular</li>
                      <li>• Plano de resposta a incidentes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 6. Seus Direitos */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">6. Seus Direitos</h2>
                <p className="text-gray-600 mb-6">
                  De acordo com a LGPD, você possui direitos em relação aos seus dados pessoais, 
                  incluindo acesso, correção, eliminação e portabilidade dos dados.
                </p>
                
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-pink-800 mb-3">Como exercer seus direitos</h3>
                  <p className="text-pink-700 mb-3">
                    Para exercer qualquer um desses direitos, entre em contato conosco através dos canais:
                  </p>
                  <ul className="space-y-1 text-pink-700">
                    <li>• E-mail: privacidade@semprebella.com.br</li>
                    <li>• Telefone: (99) 3541-2345</li>
                    <li>• Presencialmente em nossa loja</li>
                  </ul>
                </div>
              </div>

              {/* 7. Cookies */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">7. Cookies e Tecnologias Similares</h2>
                <p className="text-gray-600 mb-6">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência em nosso site. 
                  Os cookies são pequenos arquivos de texto armazenados em seu dispositivo.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Cookies Essenciais</h4>
                    <p className="text-gray-600">Necessários para o funcionamento básico do site (carrinho de compras, login, etc.).</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Cookies de Performance</h4>
                    <p className="text-gray-600">Coletam informações sobre como você usa o site para melhorarmos a performance.</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Cookies de Marketing</h4>
                    <p className="text-gray-600">Utilizados para personalizar anúncios e medir a eficácia de campanhas publicitárias.</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-6">
                  Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
                </p>
              </div>

              {/* 8. Retenção */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">8. Retenção de Dados</h2>
                <p className="text-gray-600 mb-6">
                  Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades 
                  para as quais foram coletados, respeitando os prazos legais aplicáveis:
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-800 font-medium">Dados de cadastro</span>
                    <span className="text-gray-600">Enquanto a conta estiver ativa</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-800 font-medium">Histórico de compras</span>
                    <span className="text-gray-600">5 anos (obrigação fiscal)</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-800 font-medium">Dados de navegação</span>
                    <span className="text-gray-600">12 meses</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-800 font-medium">Comunicações de marketing</span>
                    <span className="text-gray-600">Até a revogação do consentimento</span>
                  </div>
                </div>
              </div>

              {/* 9. Contato */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">9. Contato e Encarregado de Dados</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-600 mb-6">
                    Para dúvidas, solicitações ou exercício de direitos relacionados a esta Política de Privacidade, 
                    entre em contato com nosso Encarregado de Proteção de Dados:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Dados para Contato</h4>
                      <div className="space-y-2 text-gray-600">
                        <p><strong>E-mail:</strong> privacidade@semprebella.com.br</p>
                        <p><strong>Telefone:</strong> (99) 3541-2345</p>
                        <p><strong>Endereço:</strong> Rua das Flores, 123 - Centro, Balsas - MA</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Horário de Atendimento</h4>
                      <div className="space-y-2 text-gray-600">
                        <p><strong>Segunda a Sexta:</strong> 8h às 18h</p>
                        <p><strong>Sábado:</strong> 8h às 17h</p>
                        <p><strong>Domingo:</strong> 8h às 12h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. Alterações */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">10. Alterações na Política</h2>
                <p className="text-gray-600 mb-4">
                  Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças 
                  em nossas práticas de tratamento de dados ou alterações na legislação aplicável.
                </p>
                <p className="text-gray-600 mb-4">
                  Sempre que houver alterações significativas, notificaremos você através dos nossos 
                  canais de comunicação habituais (e-mail, site, etc.).
                </p>
                <p className="text-gray-600">
                  Recomendamos que você revise esta política regularmente para se manter informado 
                  sobre como protegemos seus dados pessoais.
                </p>
              </div>

              {/* Data da última atualização */}
              <div className="border-t border-gray-200 pt-8">
                <p className="text-sm text-gray-500 text-center">
                  Esta Política de Privacidade foi atualizada pela última vez em 15 de dezembro de 2024.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
