/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.datanode.configuration;

import org.graylog.security.certutil.CertConstants;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.util.Map;

public class TruststoreCreator {

    public void createTruststore(final Map<String, X509Certificate> rootCerts,
                                 final char[] truststorePassword,
                                 final Path truststorePath) throws IOException, GeneralSecurityException {
        KeyStore trustStore = KeyStore.getInstance(CertConstants.PKCS12);
        trustStore.load(null, null);

        for (Map.Entry<String, X509Certificate> cert : rootCerts.entrySet()) {
            trustStore.setCertificateEntry(cert.getKey(), cert.getValue());
        }

        try (final FileOutputStream fileOutputStream = new FileOutputStream(truststorePath.toFile())) {
            trustStore.store(fileOutputStream, truststorePassword);
        }
    }

}
