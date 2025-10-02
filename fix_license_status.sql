-- Fix pour le statut des licences annulées
-- Modifier les fonctions existantes pour préserver le statut cancelled

-- Étape 1: Modifier la fonction calculate_license_status existante
CREATE OR REPLACE FUNCTION calculate_license_status(expiry_date DATE)
RETURNS license_status AS $$
BEGIN
    -- Calculer le statut basé sur la date d'expiration
    IF expiry_date < CURRENT_DATE THEN
        RETURN 'expired';
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'about_to_expire';
    ELSE
        RETURN 'active';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Étape 2: Modifier la fonction update_license_status pour préserver le statut cancelled
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut actuel est cancelled, le préserver
    IF NEW.status = 'cancelled' THEN
        -- Conserver le statut cancelled tel quel
        NEW.status = 'cancelled';
    ELSE
        -- Sinon, calculer automatiquement le statut basé sur la date
        NEW.status = calculate_license_status(NEW.expiry_date);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 3: Recréer le trigger (au cas où il aurait été modifié)
DROP TRIGGER IF EXISTS update_license_status_trigger ON public.licenses;
CREATE TRIGGER update_license_status_trigger
    BEFORE INSERT OR UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_status();

-- Étape 4: Tester la fonction (optionnel)
-- UPDATE licenses SET status = 'cancelled' WHERE id = 'votre-id-licence';
-- SELECT * FROM licenses WHERE id = 'votre-id-licence';
