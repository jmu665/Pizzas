package com.nexo.model;

import com.nexo.model.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "conversaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurante_id", nullable = false)
    private Restaurant restaurante;

    @Column(name = "session_id", nullable = false, unique = true, length = 120)
    private String sessionId;

    @Column(nullable = false, length = 30)
    private String canal; // "WEB" o "WHATSAPP"

    @Column(name = "creada_en")
    private OffsetDateTime creadaEn;

    @PrePersist
    protected void onCreate() {
        if (creadaEn == null) {
            creadaEn = OffsetDateTime.now();
        }
    }
}
