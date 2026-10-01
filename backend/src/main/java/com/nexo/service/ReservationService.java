package com.nexo.service;

import com.nexo.dto.ReservationDtos.*;
import com.nexo.model.Reservation;
import com.nexo.model.Restaurant;
import com.nexo.repository.ReservationRepository;
import com.nexo.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuService menuService;

    @Transactional(readOnly = true)
    public AvailabilityResponse verificarDisponibilidad(CheckAvailabilityRequest request) {
        UUID resId = menuService.resolveRestauranteId(request.getRestauranteId());
        Restaurant restaurant = restaurantRepository.findById(resId).orElse(null);

        if (restaurant == null) {
            return AvailabilityResponse.builder()
                    .disponible(false)
                    .mensaje("Restaurante no configurado.")
                    .personasSolicitadas(request.getPersonas())
                    .cupoRestanteAproximado(0)
                    .build();
        }

        // Validar horario comercial
        LocalTime hora = request.getHora();
        if (hora.isBefore(restaurant.getHoraApertura()) || hora.isAfter(restaurant.getHoraCierre().minusHours(1))) {
            return AvailabilityResponse.builder()
                    .disponible(false)
                    .mensaje(String.format("Fuera de horario de servicio. Nuestro horario es de %s a %s.",
                            restaurant.getHoraApertura(), restaurant.getHoraCierre()))
                    .personasSolicitadas(request.getPersonas())
                    .cupoRestanteAproximado(0)
                    .build();
        }

        // Ventana de 1.5 horas para solapamiento de mesas
        LocalTime inicioVentana = hora.minusMinutes(90);
        LocalTime finVentana = hora.plusMinutes(90);

        int personasReservadas = reservationRepository.sumarPersonasEnHorario(
                resId, request.getFecha(), inicioVentana, finVentana);

        int capacidad = restaurant.getCapacidadMaxima();
        int cupoDisponible = Math.max(0, capacidad - personasReservadas);

        boolean hayLugar = cupoDisponible >= request.getPersonas();

        return AvailabilityResponse.builder()
                .disponible(hayLugar)
                .mensaje(hayLugar
                        ? String.format("¡Tenemos disponibilidad para %d personas el %s a las %s!",
                                request.getPersonas(), request.getFecha(), request.getHora())
                        : String.format("Lo sentimos, no hay cupo suficiente para %d personas a las %s. Solo quedan %d lugares disponibles.",
                                request.getPersonas(), request.getHora(), cupoDisponible))
                .personasSolicitadas(request.getPersonas())
                .cupoRestanteAproximado(cupoDisponible)
                .build();
    }

    @Transactional
    public ReservationResponse crearReserva(CreateReservationRequest request) {
        UUID resId = menuService.resolveRestauranteId(request.getRestauranteId());
        Restaurant restaurant = restaurantRepository.findById(resId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurante no encontrado"));

        // Validar disponibilidad antes de confirmar
        CheckAvailabilityRequest check = CheckAvailabilityRequest.builder()
                .restauranteId(resId)
                .fecha(request.getFecha())
                .hora(request.getHora())
                .personas(request.getPersonas())
                .build();

        AvailabilityResponse disp = verificarDisponibilidad(check);
        if (!disp.isDisponible()) {
            throw new IllegalStateException(disp.getMensaje());
        }

        String codigo = generarCodigoReserva();

        Reservation reservation = Reservation.builder()
                .restaurante(restaurant)
                .nombreCliente(request.getNombreCliente())
                .telefonoCliente(request.getTelefonoCliente())
                .fecha(request.getFecha())
                .hora(request.getHora())
                .personas(request.getPersonas())
                .notas(request.getNotas())
                .estado("CONFIRMADA")
                .codigoReserva(codigo)
                .build();

        reservation = reservationRepository.save(reservation);

        return ReservationResponse.builder()
                .id(reservation.getId())
                .codigoReserva(reservation.getCodigoReserva())
                .nombreCliente(reservation.getNombreCliente())
                .telefonoCliente(reservation.getTelefonoCliente())
                .fecha(reservation.getFecha())
                .hora(reservation.getHora())
                .personas(reservation.getPersonas())
                .estado(reservation.getEstado())
                .notas(reservation.getNotas())
                .mensajeConfirmacion(String.format("Reserva confirmada con éxito. Tu código de reserva es #%s.", codigo))
                .build();
    }

    private String generarCodigoReserva() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder("NX-");
        Random random = new Random();
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
