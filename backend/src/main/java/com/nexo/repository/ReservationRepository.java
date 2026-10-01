package com.nexo.repository;

import com.nexo.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    Optional<Reservation> findByCodigoReserva(String codigoReserva);

    List<Reservation> findByRestauranteIdAndFecha(UUID restauranteId, LocalDate fecha);

    @Query("SELECT COALESCE(SUM(r.personas), 0) FROM Reservation r " +
           "WHERE r.restaurante.id = :restauranteId " +
           "AND r.fecha = :fecha " +
           "AND r.hora BETWEEN :horaInicio AND :horaFin " +
           "AND r.estado = 'CONFIRMADA'")
    int sumarPersonasEnHorario(@Param("restauranteId") UUID restauranteId,
                               @Param("fecha") LocalDate fecha,
                               @Param("horaInicio") LocalTime horaInicio,
                               @Param("horaFin") LocalTime horaFin);
}
