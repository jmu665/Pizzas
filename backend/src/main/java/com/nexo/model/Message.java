package com.nexo.model;

import com.nexo.model.Conversation;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mensajes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversacion_id", nullable = false)
    private Conversation conversacion;

    @Column(nullable = false, length = 20)
    private String remitente; // "USER", "ASSISTANT", "SYSTEM"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenido;

    @Column(name = "enviado_en")
    private OffsetDateTime enviadoEn;

    @PrePersist
    protected void onCreate() {
        if (enviadoEn == null) {
            enviadoEn = OffsetDateTime.now();
        }
    }
}
