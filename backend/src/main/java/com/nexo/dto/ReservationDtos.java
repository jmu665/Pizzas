package com.nexo.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public class ReservationDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckAvailabilityRequest {
        private UUID restauranteId;
        @NotNull(message = "La fecha es requerida")
        private LocalDate fecha;
        @NotNull(message = "La hora es requerida")
        private LocalTime hora;
        @Min(value = 1, message = "Mínimo 1 persona")
        private int personas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityResponse {
        private boolean disponible;
        private String mensaje;
        private int personasSolicitadas;
        private int cupoRestanteAproximado;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateReservationRequest {
        private UUID restauranteId;
        @NotBlank(message = "El nombre del cliente es obligatorio")
        private String nombreCliente;
        @NotBlank(message = "El teléfono es obligatorio")
        private String telefonoCliente;
        @NotNull(message = "La fecha es obligatoria")
        private LocalDate fecha;
        @NotNull(message = "La hora es obligatoria")
        private LocalTime hora;
        @Min(value = 1, message = "Debe ser al menos 1 persona")
        private int personas;
        private String notas;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationResponse {
        private UUID id;
        private String codigoReserva;
        private String nombreCliente;
        private String telefonoCliente;
        private LocalDate fecha;
        private LocalTime hora;
        private int personas;
        private String estado;
        private String notas;
        private String mensajeConfirmacion;
    }
}
