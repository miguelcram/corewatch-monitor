package com.corewatch.backend.service;

import com.corewatch.backend.model.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TransactionNotificationService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.emitters.add(emitter);

        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));

        return emitter;
    }

    public void broadcastTransaction(Transaction transaction) {
        for(SseEmitter emitter : this.emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("TRANSACTION_CREATED")
                    .data(transaction));
            } catch (IOException e) {
                this.emitters.remove(emitter);
            }
        }
    }

}
