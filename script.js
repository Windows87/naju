// script.js — Integração com Google Sheets
(function(){
  const form = document.getElementById('registration');
  const foodCheckbox = document.getElementById('food');
  const paymentBlock = document.getElementById('payment-block');
  const copyPixBtn = document.getElementById('copy-pix');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');
  const closeModalBtn = document.getElementById('close-modal');
  const statusMessage = document.getElementById('status-message');

  // IMPORTANTE: Substitua pela URL do seu Google Apps Script Web App
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJyTozpOytIfA2weR0K_vT_q82a3hYCYbURPOlNGdBoUrIxRQbdykmWPTOFjrFIjUgmw/exec';

  // Garantir que o modal começa fechado
  if(modal){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function openModal(title, bodyHtml){
    console.log('openModal chamado:', title);
    if(!modal || !modalTitle || !modalBody) {
      console.error('Elementos do modal não encontrados');
      return;
    }
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  }

  function closeModal(){
    console.log('closeModal chamado');
    if(!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
  }

  function showStatus(message, isError = false){
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + (isError ? 'error' : 'success');
    statusMessage.classList.remove('hidden');
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 5000);
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name')||'').trim();
    const food = !!fd.get('food');

    if(!name){
      openModal('Erro', '<p>Nome é obrigatório.</p>');
      return;
    }

    // Verificar se URL do Google Script está configurada
    if(GOOGLE_SCRIPT_URL === 'COLE_AQUI_A_URL_DO_GOOGLE_APPS_SCRIPT'){
      openModal('Configuração pendente', '<p>A URL do Google Apps Script ainda não foi configurada. Por favor, siga as instruções no README.md para configurar a integração.</p>');
      return;
    }

    // Enviar para Google Sheets
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requer no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          food: food ? 'Sim' : 'Não',
          timestamp: new Date().toISOString()
        })
      });

      // Com no-cors, não conseguimos ler a resposta, mas se não deu erro, assumimos sucesso
      const price = food ? 16.99 : 0;
      const body = `<p>Inscrição confirmada para <strong>${escapeHtml(name)}</strong>!</p>`+
                   (food ? `<p>Valor: <strong>R$ ${price.toFixed(2)}</strong></p><p class="muted small">Aguarde pelo seu salgado!</p>` : '')+
                   `<p class="muted small">Valeu! ;)</p>`;

      openModal('Inscrição confirmada 🎉', body);
      form.reset();
      updatePaymentUI();
      showStatus('Inscrição enviada com sucesso!', false);

    } catch (error) {
      console.error('Erro ao enviar:', error);
      openModal('Erro', '<p>Ocorreu um erro ao enviar a inscrição. Tente novamente.</p>');
      showStatus('Erro ao enviar inscrição', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar presença';
    }
  });

  // Event listeners para fechar o modal
  if(closeModalBtn){
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if(modal){
    modal.addEventListener('click', function(e){ 
      if(e.target===modal) closeModal(); 
    });
  }
  
  // Fechar modal com tecla ESC
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal && !modal.classList.contains('hidden')){
      closeModal();
    }
  });

  // show/hide payment block when food is toggled
  function updatePaymentUI(){
    if(foodCheckbox && paymentBlock){
      if(foodCheckbox.checked){
        paymentBlock.classList.remove('hidden');
      } else {
        paymentBlock.classList.add('hidden');
      }
    }
  }

  if(foodCheckbox){
    foodCheckbox.addEventListener('change', updatePaymentUI);
    updatePaymentUI();
  }

  if(copyPixBtn){
    copyPixBtn.addEventListener('click', function(){
      const pix = document.getElementById('pix-payload').textContent;
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(pix).then(()=>{
          openModal('PIX copiado', '<p>Payload PIX copiado para a área de transferência. Cole no app do seu banco para pagar.</p>');
        }).catch(()=>{
          openModal('Erro', '<p>Não foi possível copiar automaticamente. Selecione e copie manualmente o código PIX.</p>');
        });
      }else{
        openModal('PIX', '<p>Copie manualmente o código PIX: <br><code>'+escapeHtml(pix)+'</code></p>');
      }
    });
  }

})();
