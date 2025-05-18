import React from "react";

import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Skeleton from "@material-ui/lab/Skeleton";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import moment from 'moment';

import Rating from '@material-ui/lab/Rating';
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	on: {
		color: green[600],
		fontSize: '20px'
	},
	off: {
		color: red[600],
		fontSize: '20px'
	},
    pointer: {
        cursor: "pointer"
    }
}));

export function RatingBox ({ rating }) {
    const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
    return <Rating
        defaultValue={ratingTrunc}
        max={5}
        readOnly
    />
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props
	const classes = useStyles();

    function renderList () {
        return attendants.map(a => (
            <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell align="center" className={classes.pointer}>
                    <RatingBox rating={a.averageRating} />
                </TableCell>
                <TableCell align="center">{a.totalTickets}</TableCell>
                <TableCell align="center">{a.openTickets}</TableCell>
                <TableCell align="center">{a.closedTickets}</TableCell>
                <TableCell align="center">{formatTime(a.avgWaitTime, 2)}</TableCell>
                <TableCell align="center">{formatTime(a.avgServiceTime, 2)}</TableCell>
                <TableCell align="center">
                    { a.online ?
                        <CheckCircleIcon className={classes.on} />
                        : <ErrorIcon className={classes.off} />
                    }
                </TableCell>
            </TableRow>
        ))
    }

	function formatTime(minutes){
		return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
	}

    return ( !loading ?
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{i18n.t("common.user")}</TableCell>
                        <TableCell align="center">{i18n.t("common.rating")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.totalTickets")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.ticketsOpen")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.ticketsDone")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.avgWaitTime")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.avgServiceTime")}</TableCell>
                        <TableCell align="center">{i18n.t("dashboard.userCurrentStatus")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { renderList() }
                </TableBody>
            </Table>
        </TableContainer>
        : <Skeleton variant="rect" height={150} />
    )
}