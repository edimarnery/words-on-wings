import threading
import time
import logging
from queue_manager import queue_manager

logger = logging.getLogger(__name__)

class QueueScheduler:
    def __init__(self):
        self.running = False
        self.cleanup_thread = None
    
    def start(self):
        """Inicia o scheduler de limpeza"""
        if self.running:
            return
        
        self.running = True
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
        logger.info("🔄 Scheduler de limpeza iniciado")
    
    def stop(self):
        """Para o scheduler"""
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=5)
        logger.info("⏹️ Scheduler de limpeza parado")
    
    def _cleanup_loop(self):
        """Loop principal de limpeza"""
        while self.running:
            try:
                # Executar limpeza de jobs expirados
                queue_manager.cleanup_expired_jobs()
                
                # Aguardar 1 hora antes da próxima limpeza
                for _ in range(3600):  # 3600 segundos = 1 hora
                    if not self.running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Erro no scheduler de limpeza: {e}")
                time.sleep(60)  # Aguardar 1 minuto em caso de erro

# Instância global do scheduler
scheduler = QueueScheduler()