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
package org.graylog.datanode.shutdown;

import org.graylog.datanode.Configuration;
import org.graylog.datanode.initializers.JerseyService;
import org.graylog2.plugin.ServerStatus;
import org.graylog2.shared.system.activities.Activity;
import org.graylog2.shared.system.activities.ActivityWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Singleton;


@Singleton
public class GracefulShutdown implements Runnable {
    private static final Logger LOG = LoggerFactory.getLogger(GracefulShutdown.class);

    private final Configuration configuration;
    private final ServerStatus serverStatus;
    private final ActivityWriter activityWriter;
    private final JerseyService jerseyService;
    private final GracefulShutdownService gracefulShutdownService;

    @Inject
    public GracefulShutdown(ServerStatus serverStatus,
                            ActivityWriter activityWriter,
                            Configuration configuration,
                            JerseyService jerseyService,
                            GracefulShutdownService gracefulShutdownService) {
        this.serverStatus = serverStatus;
        this.activityWriter = activityWriter;
        this.configuration = configuration;
        this.jerseyService = jerseyService;
        this.gracefulShutdownService = gracefulShutdownService;
    }

    @Override
    public void run() {
        doRun(true);
    }

    public void runWithoutExit() {
        doRun(false);
    }

    private void doRun(boolean exit) {
        LOG.info("Graceful shutdown initiated.");

        activityWriter.write(new Activity("Graceful shutdown initiated.", GracefulShutdown.class));

        // Trigger a lifecycle change. Some services are listening for those and will halt operation accordingly.
        serverStatus.shutdown();

        // Stop REST API service to avoid changes from outside.
        jerseyService.stopAsync();

        // Stop all services that registered with the shutdown service (e.g. plugins)
        // This must run after the BufferSynchronizerService shutdown to make sure the buffers are empty.
        gracefulShutdownService.stopAsync();

        // Wait until the shutdown service is done
        gracefulShutdownService.awaitTerminated();

        // Shut down hard with no shutdown hooks running.
        LOG.info("Goodbye.");
        if (exit) {
            System.exit(0);
        }
    }
}